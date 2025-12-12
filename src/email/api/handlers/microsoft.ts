import { microsoftOauthClient } from "@/email/clients";
import { getAccountByUserId, insertAccount, updateAccountById } from "@/db/queries/accounts";
import { syncEmails } from "@/email/cron/fetchNewEmails";
import { encrypt } from "@/utils/encryption";
import { getActiveSubscriptionByUserId } from "@/db/queries/billing";
import type { Request, Response } from "express";

export async function microsftCallback(req: Request, res: Response) {
  try {
    const query = req.query as { code?: string; state?: string };
    if (!query.code || !query.state) {
      console.error("Missing code or state in query", query);
      return res.status(400).json({ error: "Missing code or state in query" });
    }

    const userId = String(req.query.state);
    const tokens = await microsoftOauthClient.acquireTokenByCode({
      code: query.code,
      scopes: ["Mail.read", "Mail.send"],
      redirectUri: process.env.BOT_URL!,
    });

    if (!tokens || !tokens.accessToken) {
      console.error("Gmail callback missing tokens");
      return res.status(401).json({ error: "Missing tokens" });
    }

    // get the email address
    const response = await fetch('https://graph.microsoft.com/v1.0/me/', {
      headers: { Authorization: `Bearer ${tokens.accessToken}` }
    });

    const profile = await response.json() as { mail: string | null, userPrincipalName: string }
    if (!profile || (!profile.mail && !profile.userPrincipalName)) {
      throw new Error("microsoft callback missing email field");
    }

    // prepare values for DB insert
    const providerAccountId = profile.mail || profile.userPrincipalName;
    const now = new Date();
    const values = {
      userId,
      provider: "microsoft",
      providerAccountId: encrypt(providerAccountId),
      accessToken: encrypt(tokens.accessToken),
      refreshToken: "",
      expiresAt: tokens.expiresOn ? new Date(tokens.expiresOn) : null,
      updatedAt: now,
    };

    // Check if user has account
    let account;
    const existingAccount = await getAccountByUserId(userId)

    // insert into accounts table
    if (existingAccount) {
      account = await updateAccountById(existingAccount.id, values);
    } else {
      account = await insertAccount({
        ...values,
        createdAt: now
      });
    }

    if (!account) {
      throw new Error("microsoft_callback: Failed to insert account")
    }

    // sync emails if user has active subscription
    const subscriptionIsActtive = await getActiveSubscriptionByUserId(userId);
    if (subscriptionIsActtive) await syncEmails("imap.microsft.com", account.id);

    return res.redirect(process.env.BOT_URL!);
  } catch (error) {
    console.error("Gmail OAuth callback error:", error);
    return res.status(500).json({ error: "OAuth callback failed" });
  }
}
