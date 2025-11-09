import { Queue, Worker } from "bullmq";
import { fetchNewEmails } from "@/email/cron/jobs/fetchEmails";

const fetchNewEmailsQueue = new Queue("fetch-new-emails", { connection: { url: process.env.REDIS_URL! } });

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
      every: 5 * 60 * 1000,
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