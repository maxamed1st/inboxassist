import { googleOauth2Client } from "@/email/clients";
import { getAccountByUserId, insertAccount, updateAccountById } from "@/db/queries/accounts";
import type{ Request, Response } from "express";
import { keepTokensFresh } from "@/email/cron/refreshTokens";
import { syncEmails } from "@/email/cron/fetchNewEmails";
import { encrypt } from "@/utils/encryption";

export async function gmailCallback(req: Request, res: Response) {
  try {
    const query = req.query as { code?: string; state?: string };
    if (!query.code || !query.state) {
      console.error("Missing code or state in query", query);
      return res.status(400).json({ error: "Missing code or state in query" });
    }
    
    const userId = String(req.query.state);
    const { tokens } = await googleOauth2Client.getToken(query.code);

    if(!tokens || !tokens.access_token || !tokens.refresh_token) {
      console.error("Gmail callback missing tokens");
      return res.status(401).json({ error: "Missing tokens"});
    }

    // get the email address
    const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
      headers: { Authorization: `Bearer ${tokens.access_token}` }
    });

    const profile = await response.json() as { emailAddress: string }
    if(!profile || !profile.emailAddress) {
      throw new Error("Gmail callback missing email field");
    }

    // prepare values for DB insert
    const providerAccountId = profile.emailAddress;
    const now = new Date();
    const values = {
      userId,
      provider: "google",
      providerAccountId: encrypt(providerAccountId),
      accessToken: encrypt(tokens.access_token),
      refreshToken: encrypt(tokens.refresh_token),
      expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      updatedAt: now,
    };

    // Check if user has account
    let account;
    const existingAccount = await getAccountByUserId(userId)

    // insert into accounts table
    if(existingAccount) {
      account = await updateAccountById(existingAccount.id, values);
    } else {
      account = await insertAccount({
        ...values,
        createdAt: now
      });
    }
    
    if(!account) {
      throw new Error("gmail_callback: Failed to insert account")
    }

    // create background jobs to referesh tokens and fetch emails
    await keepTokensFresh("google", account.id);
    await syncEmails("imap.gmail.com", account.id);

    return res.status(200).send();
  } catch (error) {
    console.error("Gmail OAuth callback error:", error);
    return res.status(500).json({ error: "OAuth callback failed" });
  }
}
