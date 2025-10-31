import { OAuth2Client } from "google-auth-library";
import nodemailer from "nodemailer";

export const googleOauth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID!,
  process.env.GOOGLE_CLIENT_SECRET!,
  process.env.GOOGLE_REDIRECT_URI!
);

export function transporter(platform: string, clientId: string, clientSecret: string, emailAddress: string, refreshToken: string) {
  service: platform,
  auth: {
    type: "OAuth2",
    user: emailAddress,
    clientId,
    clientSecret,
    refreshToken
  }
}

export function gmailTransporter(emailAddress: string, refreshToken: string) {
  return transporter(
    platform = "gmail",
    clientId = process.env.GOOGLE_CLIENT_ID!,
    clientSecret = process.env.GOOGLE_CLIENT_SECRET!,
    emailAddress = emailAddress,
    refreshToken = refreshToken
  );
}
