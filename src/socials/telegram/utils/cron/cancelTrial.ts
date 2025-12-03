import { Queue, Worker } from "bullmq";
import { getUserIdById, updateUserById } from "@/db/queries/user";

async function cancelTrial(userId: string) {
  const user = await getUserIdById(userId);

  if (!user) {
    throw new Error(`User not found for cancelling trial: ${userId}`);
  }

  if (user.subscriptionId) {
    return; // Subscrription is managed by stripe, no action needed
  }

  const updatedUser = await updateUserById(userId, { subscriptionStatus: "cancelled", updatedAt: new Date() });

  if (!updatedUser) {
    throw new Error(`Failed to cancel trial for user:${userId}`);
  }
}

const cancelTrialQueue = new Queue("cancel-trial", { connection: { url: process.env.REDIS_URL! } });

new Worker("cancel-trial", async (job) => {
  const { userId } = job.data;
  try {
    await cancelTrial(userId);
  } catch (error) {
    console.error(`Failed to cancel subscription for ${userId}:`, error);
    const isLastAttempt = job.attemptsMade + 1 >= (job.opts.attempts ?? 1);
    if (isLastAttempt) {
      return;
    }
    throw error; // let the job be retried
  }
}, {
  connection: { url: process.env.REDIS_URL! },
});

export async function queueTrialCancelation( userId: string) {
  await cancelTrialQueue.add(`cancel-trial:${userId}`,
    { userId },
    {
      attempts: 3,
      delay: 7 * 24 * 60 * 60 * 1000, // 7 days
      removeOnComplete: true,
      removeOnFail: false,
    },
  );
}