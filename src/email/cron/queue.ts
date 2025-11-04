import { Queue, Worker } from "bullmq";
import { refreshGmailTokens } from "@/email/cron/jobs";
import { publish } from "@/events/broker";
import { fetchNewEmails } from "@/email/cron/jobs";

const queueName = "refresh-account-tokens";

export const refreshTokensQueue = new Queue(queueName, { connection: { url: process.env.REDIS_URL! } });

new Worker(queueName, async (job) => {
    const { provider, providerAccountId, userId } = job.data;
    if (provider === "google" && providerAccountId) {
      try {
        await refreshGmailTokens(providerAccountId);
      } catch (error) {
        console.error(`Failed to refresh tokens for ${providerAccountId}:`, error);
        const isLastAttempt = job.attemptsMade + 1 >= (job.opts.attempts ?? 1);
        if (isLastAttempt) {
          // reauthenticate user
          publish("email:login", { userId, platform: "google" });
          return;
        }
        throw error; // let the job be retried
      }
    }
}, {
  connection: { url: process.env.REDIS_URL! },
});

export const getNewEmailsQueue = new Queue("get-new-emails", { connection: { url: process.env.REDIS_URL! } });

new Worker("get-new-emails", async (job) => {
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