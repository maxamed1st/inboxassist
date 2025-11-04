import { redisClient } from "@/events/client";

export default async function main() {
  redisClient.on("connect", () => console.log("Redis client connected"));
  redisClient.on("error", (err) => console.log("Redis Client Error", err));
}