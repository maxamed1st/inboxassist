import { googleOauth2Client } from "@/email/clients";
import { getAccountByProviderAccountId, updateAccount } from "@/db/queries/accounts";
import jwt from "jsonwebtoken";
import { imapClient } from "@/email/clients";
import { simpleParser } from "mailparser";
import { insertEmail } from "@/db/queries/emails";

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
export async function fetchNewEmails(host: string, providerAccountId: string) {
  const account = await getAccountByProviderAccountId(providerAccountId);
  if (!account?.accessToken) {
    console.warn("No access token found for account", providerAccountId);
    return;
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

      // Helper to normalize addresses
      function formatAddresses(addresses: any) {
        if (!addresses) return [];
        const addressArray = Array.isArray(addresses) ? addresses : [addresses];
        return addressArray
          .map(addr => addr.address || addr)
          .filter(Boolean);
      }

      // Helper to normalize references
      function normalizeReferences(refs: string | string[] | undefined): string[] {
        if (!refs) return [];
        return Array.isArray(refs) ? refs : [refs];
      }

      await insertEmail({
        userId: account.userId,
        accountId: account.id,
        emailId: parsed.messageId || crypto.randomUUID(),
        from: parsed.from?.text || "unknown",
        to: formatAddresses((parsed.to as any)?.value),
        cc: formatAddresses((parsed.cc as any)?.value),
        bcc: formatAddresses((parsed.bcc as any)?.value),
        inReplyTo: parsed.inReplyTo,
        references: normalizeReferences(parsed.references),
        subject: parsed.subject || "",
        content: { 
          text: parsed.text, 
          html: parsed.html || undefined 
        },
        date: parsed.date?.getTime() || Date.now(),
        status: "received",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
  } catch (error) {
    console.error("Error fetching email:", error);
  } finally {
    lock.release();
    await client.logout();
  }
}