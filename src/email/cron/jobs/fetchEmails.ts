import { imapClient } from "@/email/clients";
import { getAccountById } from "@/db/queries/accounts";
import { processEmail } from "@/email/utils/processEmail";
import { decrypt } from "@/utils/encryption";

export async function fetchNewEmails(host: string, accountId: string) {
  const account = await getAccountById(accountId);
  if (!account?.accessToken) {
    console.warn("No access token found for account", accountId);
    return;
  }

  const client = imapClient({
    host,
    emailAddress: account.providerAccountId,
    accessToken: decrypt(account.accessToken),
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
      processEmail(message, account.userId, account.id);
    }
  } catch (error) {
    console.error("Error fetching email:", error);
  } finally {
    lock.release();
    await client.logout();
  }
}
