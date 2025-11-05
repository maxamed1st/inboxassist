import initializeDb from "@/db"
import initializeRedis from "@/events/index";
import initializeServer from "@/server";
import initializeMail from "@/email/index";
import initializeTelegramBot from "@/socials/telegram/index";

async function main() {
  // initializations
  await initializeDb();
  await initializeRedis();
  initializeServer();
  await initializeMail();
  initializeTelegramBot();
}

main()
