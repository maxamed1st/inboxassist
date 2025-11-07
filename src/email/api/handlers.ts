import { googleOauth2Client } from "@/email/clients";
import { insertAccount } from "@/db/queries/accounts";
import type{ Request, Response } from "express";
import { keepTokensFresh, syncEmails } from "../utils/scheduling";

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
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` }
    });

    const userInfo = await response.json() as { email: string }
    if(!userInfo || !userInfo.email) {
      throw new Error("Gmail callback missing email field");
    }

    // prepare values for DB insert
    const providerAccountId = userInfo.email;
    const now = new Date();
    const values = {
      userId,
      provider: "google",
      providerAccountId,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      createdAt: now,
      updatedAt: now,
    };

    // insert into accounts table
    const account = await insertAccount(values);
    
    if(!account) {
      throw new Error("gmail_callback: Failed to insert account")
    }

    // create background jobs to referesh tokens and fetch emails
    await keepTokensFresh("google", providerAccountId);
    await syncEmails("imap.google.com", providerAccountId);

    return res.json({ success: true, providerAccountId });
  } catch (error) {
    console.error("Gmail OAuth callback error:", error);
    return res.status(500).json({ error: "OAuth callback failed" });
  }
}