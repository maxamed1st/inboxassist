import { googleOauth2Client } from "@/email/clients";
import { getAccountByProviderAccountId, updateAccount } from "@/db/queries/accounts";
import jwt from "jsonwebtoken";

// refresh access token when expired
export async function refreshGmailTokens(accountId: string) {
  const account = await getAccountByProviderAccountId(accountId);
  if (!account) {
    throw new Error("No account found for" + accountId);
  }

  googleOauth2Client.setCredentials({ refresh_token: account.refreshToken });
  const { credentials } = await googleOauth2Client.refreshAccessToken();
  if (!credentials || !credentials.access_token || !credentials.refresh_token) {
    throw new Error("Failed to refresh access token");
  }

  // get the email address
  const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${credentials.access_token}` }
  });

  const userInfo = await response.json() as { email: string }
  if(!userInfo || !userInfo.email) {
    throw new Error("Gmail callback missing email field");
  }

  const providerAccountId = userInfo.email;
  const values = {
    accessToken: credentials.access_token,
    refreshToken: credentials.refresh_token,
    expiresAt: credentials.expiry_date ? new Date(credentials.expiry_date) : null,
    updatedAt: new Date(),
  };

  const updatedAccount = await updateAccount(providerAccountId, values);

  if (!updatedAccount) {
    throw new Error("Failed to update tokens for" + account.providerAccountId);
  }
}