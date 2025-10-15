import { connectRedis } from "@/events/client.js";

export default async function main() {
  // initializations
  await connectRedis();
}