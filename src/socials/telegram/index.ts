import { sendMessage } from "@/socials/telegram/utils/sendMessage"
import { subscribe } from "@/events/broker";
import handleCommands from "./utils/commands";
import { telegramBotClient } from "./client";

export default async function main() {
  const bot = telegramBotClient();
  // handle commands
  await handleCommands();

  // register listeners
  subscribe("message:system", "telegram_bot", async ({id, content}) => {
    sendMessage(bot, id, content);
  })
  
  subscribe("message:assistant", "telegram_bot", async ({id, content}) => {
    sendMessage(bot, id, content);
  })
}
