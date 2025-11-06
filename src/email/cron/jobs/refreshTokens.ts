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
  if (!credentials || !credentials.access_token || !credentials.refresh_token || !credentials.id_token || !credentials.expiry_date) {
    throw new Error("Failed to refresh access token");
  }
  
  // decode the user's email from the ID token
  const decoded = jwt.decode(credentials.id_token) as { email: string };
  const providerAccountId = decoded.email;

  const values = {
    accessToken: credentials.access_token,
    refreshToken: credentials.refresh_token,
    expiresAt: credentials.expiry_date,
    updatedAt: new Date(),
  };

  const updatedAccount = await updateAccount(providerAccountId, values);

  if (!updatedAccount) {
    throw new Error("Failed to update tokens for" + account.providerAccountId);
  }
}