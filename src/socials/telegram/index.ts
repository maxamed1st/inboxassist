import { sendMessage } from "@/socials/telegram/utils/sendMessage"
import { subscribe } from "@/events/broker";
import handleCommands from "./utils/commands";

export default async function main() {
  // handle commands
  await handleCommands();

  // register listeners
  subscribe("message:system", "telegram_bot", async ({id, content}) => {
    sendMessage(id, content);
  })
  
  subscribe("message:assistant", "telegram_bot", async ({id, content}) => {
    sendMessage(id, content);
  })
}
