import { microsoftOauthClient } from "@/email/clients";
import { getAccountByUserId, insertAccount, updateAccountById } from "@/db/queries/accounts";
import { syncEmails } from "@/email/cron/fetchNewEmails";
import { encrypt } from "@/utils/encryption";
import type { Request, Response } from "express";
import { getUserById, updateUserById } from "@/db/queries/user";
import { publish } from "@/events/broker";
import { keepTokensFresh } from "@/email/cron/refreshTokens";

function partitionTokenCache(fullcache: string, homeAccountId: string) {
  const cache = JSON.parse(fullcache);

  for (const key of ["AccessToken", "RefreshToken", "IdToken", "Account"]) {
    if(!Array.isArray(cache[key])) {
      cache[key] = [];
    }

    if(cache[key]) {
      cache[key] = cache[key].filter( (t: any) => t.homeAccountId == homeAccountId);
    }
  }

  return JSON.stringify(cache);
}

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
      scopes: [
        "https://outlook.office.com/IMAP.AccessAsUser.All",
        "https://outlook.office.com/SMTP.send",
        "offline_access",
      ],
      redirectUri: process.env.MICROSOFT_REDIRECT_URI!,
    });

    if (!tokens || !tokens.accessToken) {
      console.error("microsoft_callback missing tokens");
      return res.status(401).json({ error: "Missing tokens" });
    }

    // get the email address
    const graphTokens = await microsoftOauthClient.acquireTokenSilent({
      account: tokens.account!,
      scopes: [
        "user.read"
      ],
    });
 
    const response = await fetch('https://graph.microsoft.com/v1.0/me/', {
      headers: { Authorization: `Bearer ${graphTokens.accessToken}` }
    });

    const profile = await response.json() as { mail: string | null, userPrincipalName: string, displayName: string }
    if (!profile || (!profile.mail && !profile.userPrincipalName)) {
      throw new Error("microsoft callback missing email field");
    }

    //extract user token cache
    const homeAccountId = tokens.account?.homeAccountId!;
    const fullCache = microsoftOauthClient.getTokenCache().serialize();
    const userTokenCache = partitionTokenCache(fullCache, homeAccountId);

    // prepare values for DB insert
    const providerAccountId = profile.mail || profile.userPrincipalName;
    const now = new Date();
    const values = {
      userId,
      provider: "microsoft",
      providerAccountId: encrypt(providerAccountId),
      providerIMAP: encrypt("outlook.office365.com"),
      providerSMTP: encrypt("smtp.office365.com"),
      accessToken: encrypt(tokens.accessToken),
      refreshToken: encrypt(userTokenCache),
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
    const user = await getUserById(userId);

    if (!user) {
      throw new Error("microsoft_callback: Failed to get user")
    }

    if (user.subscriptionStatus === "active" || user.subscriptionStatus === "trialing") {
      await syncEmails(account.id);
      await keepTokensFresh("microsoft", account.id);
    }

    await publish("message:system", {
      userId,
      content: "Your email has been connected successfully"
    })

    // update user info
    const updatedUser = updateUserById(userId, {
      name: encrypt(profile.displayName),
      email: encrypt(providerAccountId)
    })

    if(!updatedUser) {
      throw new Error(`micrsoft_callback: Failed to update user table: ${userId}`)
    }

    return res.redirect(process.env.BOT_URL!);
  } catch (error) {
    console.error("microsoft_callback OAuth callback error:", error);
    return res.status(500).json({ error: "OAuth callback failed" });
  }
}
