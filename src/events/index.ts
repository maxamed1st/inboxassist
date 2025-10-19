import { connectRedis } from "@/events/client";

export default async function main() {
  // initializations
  await connectRedis();
}