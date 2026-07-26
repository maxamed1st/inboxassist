import { microsoftOauthClient } from "@/email/clients";
import type { Request, Response } from "express";
import { publish } from "@/events/broker";
import { HandleNewEmailConnection } from "@/email/utils/HandleNewEmailConnection";

function partitionTokenCache(fullcache: string, homeAccountId: string) {
  const cache = JSON.parse(fullcache);
  const filtered: any = {}

  for (const key of ["AccessToken", "RefreshToken", "IdToken", "Account", "AppMetaData"]) {
    if (cache[key]) {
      filtered[key] = {};
      for (const [k, v] of Object.entries(cache[key])) {
        if ((v as any).home_account_id == homeAccountId) {
          filtered[key][k] = v;
        }
      }
    }
  }

  return JSON.stringify(filtered);
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

    if(!tokens.account) {
      console.error("microsoft_callback tokens missing account");
      return res.status(401).json({ error: "Tokens Missing account" });
    } 

    //extract user token cache
    const homeAccountId = tokens.account.homeAccountId;
    const fullCache = microsoftOauthClient.getTokenCache().serialize();
    const userTokenCache = partitionTokenCache(fullCache, homeAccountId);

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
    const providerAccountId = profile.mail || profile.userPrincipalName;

    await HandleNewEmailConnection({
      userId,
      provider: "microsoft",
      providerAccountId,
      imapHost: "outlook.office365.com",
      smtpHost: "smtp.office365.com",
      accessToken: tokens.accessToken,
      refreshToken: userTokenCache,
      expiresAt: tokens.expiresOn,
      displayName: profile.displayName
    });

    await publish("message:system", {
      userId,
      content: "Your email has been connected successfully"
    })

    return res.redirect(process.env.BOT_URL!);
  } catch (error) {
    console.error("microsoft_callback OAuth callback error:", error);
    return res.status(500).json({ error: "OAuth callback failed" });
  }
}
