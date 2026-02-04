import { redisClient } from "@/events/clients";
import type { Channels, MessagePayloads } from "@/events/types";
import { consumeLoop, retryLoop } from "@/events/utils/subscriptionLoops";

const STREAM_PREFIX = "inboxassist:";

/**
 * Publish a message to a stream.
 */
export async function publish<T extends Channels>(
  channel: T,
  message: MessagePayloads[T]
) {
  const stream = `${STREAM_PREFIX}${channel}`;
  const payload = JSON.stringify({ message, retries: 0 });
  await redisClient.xadd(stream, "*", "data", payload);
  console.log(`[PUBLISH] ${channel}`);
}

/**
 * Subscribe a single consumer (subscriber group) to a channel stream.
 * Each subscriber group receives all messages independently.
 */
export async function subscribe<T extends Channels>(
  channel: T,
  subscriberName: string,
  handler: (msg: MessagePayloads[T]) => Promise<void>
) {
  const stream = `${STREAM_PREFIX}${channel}`;
  const group = subscriberName; // 1 group = 1 subscriber
  const consumer = `${subscriberName}-1`; // single consumer per subscriber

  // Ensure group exists
  try {
    await redisClient.xgroup("CREATE", stream, group, "0", "MKSTREAM");
  } catch (err: any) {
    if (!err.message.includes("BUSYGROUP")) throw err;
  }

  console.log(`[SUBSCRIBE] ${channel} -> ${subscriberName}`);
  
  consumeLoop(group, consumer, stream, handler);
  retryLoop(group, consumer, stream, handler);
}
