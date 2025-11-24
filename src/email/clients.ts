import { OAuth2Client } from "google-auth-library";
import nodemailer from "nodemailer";
import { ImapFlow } from "imapflow";
import SMTPTransport from "nodemailer/lib/smtp-transport";

export const googleOauth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID!,
  process.env.GOOGLE_CLIENT_SECRET!,
  process.env.GOOGLE_REDIRECT_URI!
);

export function transporter({ host, port = 587, emailAddress, accessToken, type = "OAuth2" }:
  { host: string, port?: number, emailAddress: string, accessToken: string, type?: "OAuth2" | "OAUTH2" | "oauth2"  }) {
    const options : SMTPTransport.Options = {
      host,
      port,
      secure: false,
      requireTLS: true,
      auth: {
        type,
        user: emailAddress,
        accessToken
      }
    };
  return nodemailer.createTransport(options);
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
