import { googleOauth2Client } from "../clients";

export function getGmailAuthUrl(userId: string) {
  const scopes = [
    "https://mail.google.com/"
  ];
  const authUrl = googleOauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: scopes,
    prompt: "consent",
    state: userId
  });

  return authUrl
}
