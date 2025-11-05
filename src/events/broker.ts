import { redisClient } from "@/events/client";
import type { Channels, MessagePayloads } from "@/events/types";

const STREAM_PREFIX = "inboxassist:";
const DLQ_SUFFIX = ":dlq";
const MAX_RETRIES = 3;
const CLAIM_IDLE_MS = 5000; // 5s idle before retry
const BLOCK_MS = 5000;

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
  console.log(`[PUBLISH] ${channel}`, message);
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

  // helper to parse messages
  function parseFields(fields?: string[]): Record<string, string> {
    const obj: Record<string, string> = {};
    if (!fields) return obj;
    for (let i = 0; i < fields.length; i += 2) {
      const key = fields[i];
      const value = fields[i + 1];
      if (key !== undefined && value !== undefined) {
        obj[key] = value;
      }
    }
    return obj;
  }


  // Consume loop
  async function consumeLoop() {
    while (true) {
      const response = await redisClient.xreadgroup(
        "GROUP",
        group,
        consumer,
        "COUNT",
        10,
        "BLOCK",
        BLOCK_MS,
        "STREAMS",
        stream,
        ">"
      ) as any;

      if (!response) continue;

      for (const [, messages] of response) {
        for (const [id, fields] of messages) {
          const msg = { id, message: parseFields(fields) };
          await processMessage(stream, group, msg, handler);
        }
      }
    }
  }

  // Retry loop for stuck/pending messages
  async function retryLoop() {
    while (true) {
      await new Promise((r) => setTimeout(r, BLOCK_MS));
      const [, messages] = await redisClient.xautoclaim(
        stream,
        group,
        consumer,
        CLAIM_IDLE_MS,
        "0-0",
        "COUNT",
        10
      ) as any;

      if (!messages?.length) continue;

      for (const [id, fields] of messages) {
        const msg = { id, message: parseFields(fields) };
        await processMessage(stream, group, msg, handler);
      }
    }
  }

  consumeLoop();
  retryLoop();
}

/**
 * Internal: Process and ack or retry a message.
 */
async function processMessage<T extends Channels>(
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
