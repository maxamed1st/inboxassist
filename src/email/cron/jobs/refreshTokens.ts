import { googleOauth2Client } from "@/email/clients";
import { getAccountByProviderAccountId, updateAccount } from "@/db/queries/accounts";
import jwt from "jsonwebtoken";

// refresh access token when expired
export async function refreshGmailTokens(accountId: string) {
  const account = await getAccountByProviderAccountId(accountId);
  if (!account?.refreshToken) {
    throw new Error("No refresh token found for account");
  }

  googleOauth2Client.setCredentials({ refresh_token: account?.refreshToken });
  const { credentials } = await googleOauth2Client.refreshAccessToken();
  if (!credentials || !credentials.access_token || !credentials.refresh_token || !credentials.id_token || !credentials.expiry_date) {
    throw new Error("Failed to refresh access token");
  }
  
  // decode the user's email from the ID token
  const decoded = jwt.decode(credentials.id_token) as { email: string };
  const providerAccountId = decoded?.email ?? "unknown";

  const values = {
    accessToken: credentials.access_token,
    refreshToken: credentials.refresh_token,
    expiresAt: Math.floor(credentials.expiry_date / 1000),
    updatedAt: Math.floor(Date.now() / 1000),
  };

  await updateAccount(providerAccountId, values);
}
