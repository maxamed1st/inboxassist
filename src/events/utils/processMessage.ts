import { redisClient } from "@/events/client";
import type { Channels, MessagePayloads } from "@/events/types";

const DLQ_SUFFIX = ":dlq";
const MAX_RETRIES = 3;

/**
 * Internal: Process and ack or retry a message.
 */
export async function processMessage<T extends Channels>(
  stream: string,
  group: string,
  msg: { id: string; message: Record<string, string> },
  handler: (msg: MessagePayloads[T]) => Promise<void>
) {
  const raw = msg.message.data;
  const parsed = JSON.parse(raw || "{}") as {
    message: MessagePayloads[T];
    retries: number;
  };

  const retries = parsed.retries ?? 0;

  try {
    await handler(parsed.message);
    await redisClient.xack(stream, group, msg.id);
  } catch (err) {
    console.error(`[ERROR] ${group} failed message ${msg.id}:`, err);

    if (retries >= MAX_RETRIES) {
      console.warn(`[DLQ] ${group} -> ${msg.id}`);
      await redisClient.xadd(`${stream}${DLQ_SUFFIX}`, "*", "data", raw || "");
      await redisClient.xack(stream, group, msg.id);
    } else {
      const payload = JSON.stringify({
        message: parsed.message,
        retries: retries + 1,
      });
      await redisClient.xadd(stream, "*", "data", payload);
      await redisClient.xack(stream, group, msg.id);
    }
  }
}
