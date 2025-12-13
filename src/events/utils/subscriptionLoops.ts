import { redisClient } from "@/events/client";
import { processMessage } from "@/events/utils/processMessage";
import { Channels, MessagePayloads } from "@/events/types";

const CLAIM_IDLE_MS = 60000; // 60s idle before retry
const BLOCK_MS = 100;

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

// Consume events loop
export async function consumeLoop<T extends Channels>(group: string, consumer: string, stream: string, handler: (msg: MessagePayloads[T]) => Promise<void>) {
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
export async function retryLoop<T extends Channels>(group: string, consumer: string, stream: string, handler: (msg: MessagePayloads[T]) => Promise<void>) {
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

