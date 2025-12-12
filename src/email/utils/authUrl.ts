import { googleOauth2Client, microsoftOauthClient } from "../clients";

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

export async function getMicrosoftAuthUrl(userId: string) {
  const scopes = [ "Mail.read", "Mail.send" ]

  const authUrl = await microsoftOauthClient.getAuthCodeUrl({
    scopes,
    redirectUri: process.env.BOT_URL!,
    state: userId
  })

  return authUrl
}
