import { googleOauth2Client } from "@/email/clients";
import type{ Request, Response } from "express";
import { publish } from "@/events/broker";
import { HandleNewEmailConnection } from "@/email/utils/HandleNewEmailConnection";

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

    // get the display name
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` }
    });
    const userInfo = await userInfoResponse.json() as { name?: string };



    await HandleNewEmailConnection({
      userId,
      provider: "google",
      providerAccountId: profile.emailAddress,
      imapHost: "imap.gmail.com",
      smtpHost: "smtp.gmail.com",
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: tokens.expiry_date || null,
      displayName: userInfo.name || ""
    });
 
    await publish("message:system", {
      userId,
      content: "Your email has been connected successfully"
    })
    return res.redirect(process.env.BOT_URL!);
  } catch (error) {
    console.error("Gmail OAuth callback error:", error);
    return res.status(500).json({ error: "OAuth callback failed" });
  }
}
