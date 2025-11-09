import { Queue, Worker } from "bullmq";
import { refreshGmailTokens } from "@/email/cron/jobs/refreshTokens";
import { publish } from "@/events/broker";

const refreshTokensQueue = new Queue("refresh-account-tokens", { connection: { url: process.env.REDIS_URL! } });

new Worker("refresh-account-tokens", async (job) => {
    const { provider, accountId, userId } = job.data;
    if (provider === "google" && accountId) {
      try {
        await refreshGmailTokens(accountId);
      } catch (error) {
        console.error(`Failed to refresh tokens for ${accountId}:`, error);
        const isLastAttempt = job.attemptsMade + 1 >= (job.opts.attempts ?? 1);
        if (isLastAttempt) {
          // reauthenticate user
          publish("email:connect", { userId, platform: "gmail" });
          return;
        }
        throw error; // let the job be retried
      }
    }
}, {
  connection: { url: process.env.REDIS_URL! },
});

export async function keepTokensFresh( provider: string, accountId: string) {
  await refreshTokensQueue.upsertJobScheduler(`refresh-tokens:${accountId}`,
    {
      every: 50 * 60 * 1000,
      startDate: new Date(Date.now() + 50 * 60 * 1000)
    },
    {
      name: "refresh-tokens",
      data: { provider, accountId },
      opts: {
      attempts: 3,
      backoff: { type: "exponential", delay: 60000 },
      removeOnComplete: true,
      removeOnFail: false,
      },
    }
  );
}

export async function stopRefereshingTokens(accountId: string) {
  const removed = await refreshTokensQueue.removeJobScheduler(`refresh-tokens:${accountId}`);
  if (!removed) {
    console.warn(`QUEUE: Could not find scheduler for deletion: refresh-tokens:${accountId}`)
  }

  return removed;
}
