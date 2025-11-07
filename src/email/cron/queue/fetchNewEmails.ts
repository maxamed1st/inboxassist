import { Queue, Worker } from "bullmq";
import { fetchNewEmails } from "@/email/cron/jobs/fetchEmails";

const fetchNewEmailsQueue = new Queue("fetch-new-emails", { connection: { url: process.env.REDIS_URL! } });

new Worker("fetch-new-emails", async (job) => {
    const { host, providerAccountId } = job.data;
    if (host && providerAccountId) {
      try {
        await fetchNewEmails(host, providerAccountId);
      } catch (error) {
        console.error(`Failed to fetch new emails for ${providerAccountId}:`, error);
        const isLastAttempt = job.attemptsMade + 1 >= (job.opts.attempts ?? 1);
        if (isLastAttempt) return;
        throw error; // let the job be retried
      }
    }
}, {
  connection: { url: process.env.REDIS_URL! },
});

export async function syncEmails(host: string, providerAccountId: string) {
  await fetchNewEmailsQueue.upsertJobScheduler(`fetch-emails:${providerAccountId}`,
    {
      every: 5 * 60 * 1000,
      immediately: true,
    },
    {
      name: "fetch-emails",
      data: { host, providerAccountId },
      opts: {
      attempts: 3,
      backoff: { type: "exponential" },
      removeOnComplete: true,
      removeOnFail: false,
      }
    }
  );
}

export async function cancelEmailSync(providerAccountId: string) {
  const removed = await fetchNewEmailsQueue.removeJobScheduler(`fetch-emails:${providerAccountId}`);
  if (!removed) {
    console.warn(`QUEUE: Could not find scheduler for deletion: refresh-tokens:${providerAccountId}`)
  }

  return removed;
}