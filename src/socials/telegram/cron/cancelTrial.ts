import { Queue, Worker } from "bullmq";
import { getUserById, updateUserById } from "@/db/queries/user";
import { publish } from "@/events/broker";
import { ctxError } from "@/utils/errorHandling";

async function cancelTrial(userId: string) {
  const user = await getUserById(userId);

  if (!user) {
    throw ctxError("cancelTrial: User not found for cancelling trial", { ctx: { userId } });
  }

  if (user.subscriptionId) {
    return; // Subscrription is managed by stripe, no action needed
  }

  const updatedUser = await updateUserById(userId, { subscriptionStatus: "inactive", updatedAt: new Date() });

  if (!updatedUser) {
    throw ctxError("cancelTrial: Failed to cancel trial", { ctx: { userId } });
  }

  await publish("message:system", {
    userId: userId,
    content: "Your trial period has ended. Please use /subscribe to continue managing emails with the assitant.",
  });
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
