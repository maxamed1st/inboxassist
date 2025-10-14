import { connectRedis } from "@/events/client.js"

async function main() {
  await connectRedis();
}

main()
