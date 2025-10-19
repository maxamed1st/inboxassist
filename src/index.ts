import initializeRedis from "@/events/index";
import initializeServer from "@/server";

async function main() {
  // initializations
  await initializeRedis();
  initializeServer();
}

main()