import initializeRedis from "@/events/index";
import initializeServer from "@/server";
import initializeMail from "@/email/index";

async function main() {
  // initializations
  await initializeRedis();
  initializeServer();
  await initializeMail();
}

main()