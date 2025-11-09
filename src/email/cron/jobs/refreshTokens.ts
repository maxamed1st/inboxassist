import { googleOauth2Client } from "@/email/clients";
import { getAccountById, updateAccountById } from "@/db/queries/accounts";
import { encrypt, decrypt} from "@/utils/encryption"

// refresh access token when expired
export async function refreshGmailTokens(accountId: string) {
  const account = await getAccountById(accountId);
  if (!account) {
    throw new Error("No account found for" + accountId);
  }

  googleOauth2Client.setCredentials({ refresh_token: decrypt(account.refreshToken) });
  const { credentials } = await googleOauth2Client.refreshAccessToken();
  if (!credentials || !credentials.access_token || !credentials.refresh_token) {
    throw new Error("Failed to refresh access token");
  }

  const values = {
    accessToken: encrypt(credentials.access_token),
    refreshToken: encrypt(credentials.refresh_token),
    expiresAt: credentials.expiry_date ? new Date(credentials.expiry_date) : null,
    updatedAt: new Date(),
  };

  const updatedAccount = await updateAccountById(accountId, values);

  if (!updatedAccount) {
    throw new Error("Failed to update tokens for" + account.providerAccountId);
  }
}