import { OAuth2Client } from "google-auth-library";
import nodemailer from "nodemailer";
import { ImapFlow } from "imapflow";

export const googleOauth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID!,
  process.env.GOOGLE_CLIENT_SECRET!,
  process.env.GOOGLE_REDIRECT_URI!
);

export function transporter({ platform, clientId, clientSecret, emailAddress, refreshToken }: { platform: string, clientId: string, clientSecret: string, emailAddress: string, refreshToken: string }) {
  return nodemailer.createTransport({
  service: platform,
  auth: {
    type: "OAuth2",
    user: emailAddress,
    clientId,
    clientSecret,
    refreshToken
  }
  })
}

export function gmailTransporter({emailAddress, refreshToken} : { emailAddress: string, refreshToken: string }) {
  return transporter({
    platform : "gmail",
    clientId : process.env.GOOGLE_CLIENT_ID!,
    clientSecret : process.env.GOOGLE_CLIENT_SECRET!,
    emailAddress,
    refreshToken
  });
}

export function imapClient({ host, port = 993, emailAddress, accessToken, method = "OAuth2" }
  : { host: string, port?: number, emailAddress: string, accessToken: string, method?: string }
) {
  return new ImapFlow({
    host: host,
    port: port,
    secure: true,
    auth: {
      user: emailAddress,
      accessToken: accessToken,
      loginMethod: method
    }
  });
}