import { redisClient } from "@/events/client.js";
import type { Channels, MessagePayloads } from "@/events/types.js";

// Publisher
export const publish = async <T extends Channels>(
  channel: T,
  message: MessagePayloads[T]
) => {
  await redisClient.publish(channel, JSON.stringify(message));
  console.log(`Published to ${channel}:`, message);
};

// Subscriber
export const subscribe = async <T extends Channels>(
  channel: T,
  callback: (message: MessagePayloads[T]) => void
) => {
  const subscriber = redisClient.duplicate();
  await subscriber.connect();

  await subscriber.subscribe(channel, (message) => {
    const parsed: MessagePayloads[T] = JSON.parse(message);
    callback(parsed);
  });

  console.log(`Subscribed to ${channel}`);
};