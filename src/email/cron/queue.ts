import { Queue, Worker } from "bullmq";
import { refreshGmailTokens } from "./jobs.js";
import { publish } from "@/events/pubsub.js";

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