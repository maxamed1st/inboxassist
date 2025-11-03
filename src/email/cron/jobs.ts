import { googleOauth2Client } from "@/email/clients";
import { getAccountByProviderAccountId, updateAccount } from "@/db/queries/accounts";
import jwt from "jsonwebtoken";
import { imapClient } from "@/email/clients";
import { simpleParser } from "mailparser";

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

// Get new emails
export async function fetchNewEmails(host: string, accountId: string) {
  const account = await getAccountByProviderAccountId(accountId);
  if (!account?.accessToken) {
    throw new Error("No access token found for account");
  }

  const client = imapClient({
    host,
    emailAddress: account.providerAccountId,
    accessToken: account.accessToken,
  });
  await client.connect();

  const lock = await client.getMailboxLock('INBOX');
  try {
    // Search for unseen emails since yesterday
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const uids = await client.search({ seen: false, since: yesterday });

    if (!uids) {
      return;
    }

    for await (const message of client.fetch(uids, { source: true })) {
      if (!message.source) {
        continue;
      }
      const parsed = await simpleParser(message.source);
      console.log("New email from:", parsed.from?.text, "Subject:", parsed.subject);
    }
  } catch (error) {
    console.error("Error fetching email:", error);
  } finally {
    lock.release();
    await client.logout();
  }
}