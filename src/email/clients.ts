import { OAuth2Client } from "google-auth-library";

export const googleOauth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID!,
  process.env.GOOGLE_CLIENT_SECRET!,
  process.env.GOOGLE_REDIRECT_URI!
);

// generate consent URL
export function authorizeGmail(userId: string) {
    const scopes = ["https://mail.google.com/"];
    const authUrl = googleOauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: scopes,
    state: userId
    });

    return authUrl;
}