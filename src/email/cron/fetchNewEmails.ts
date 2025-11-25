import { Queue, Worker } from "bullmq";
import { imapClient } from "@/email/clients";
import { getAccountById } from "@/db/queries/accounts";
import { processEmail } from "@/email/utils/processEmail";
import { decrypt } from "@/utils/encryption";



const fetchNewEmailsQueue = new Queue("fetch-new-emails", { connection: { url: process.env.REDIS_URL! } });

async function fetchNewEmails(host: string, accountId: string) {
  const account = await getAccountById(accountId);
  if (!account?.accessToken) {
    console.warn("No access token found for account", accountId);
    return;
  }

  const client = imapClient({
    host,
    emailAddress: decrypt(account.providerAccountId),
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
      const processed = await processEmail(message, account.userId, account.id);
      if(processed) await client.messageFlagsAdd(message.uid, ["\\seen"], { uid: true });
    }
  } catch (error) {
    console.error("Error fetching email:", error);
  } finally {
    lock.release();
    await client.logout();
  }
}

new Worker("fetch-new-emails", async (job) => {
    const { host, accountId } = job.data;
    if (host && accountId) {
      try {
        await fetchNewEmails(host, accountId);
      } catch (error) {
        console.error(`Failed to fetch new emails for ${accountId}:`, error);
        const isLastAttempt = job.attemptsMade + 1 >= (job.opts.attempts ?? 1);
        if (isLastAttempt) return;
        throw error; // let the job be retried
      }
    }
}, {
  connection: { url: process.env.REDIS_URL! },
});

export async function syncEmails(host: string, accountId: string) {
  await fetchNewEmailsQueue.upsertJobScheduler(`fetch-emails:${accountId}`,
    {
      every: 3 * 60 * 1000,
    },
    {
      name: "fetch-emails",
      data: { host, accountId },
      opts: {
      attempts: 3,
      backoff: { type: "exponential" },
      removeOnComplete: true,
      removeOnFail: false,
      }
    }
  );
}

export async function cancelEmailSync(accountId: string) {
  const removed = await fetchNewEmailsQueue.removeJobScheduler(`fetch-emails:${accountId}`);
  if (!removed) {
    console.warn(`QUEUE: Could not find scheduler for deletion: refresh-tokens:${accountId}`)
  }

  return removed;
}
