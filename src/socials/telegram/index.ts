import { sendMessage } from "@/socials/telegram/utils/sendMessage"
import { subscribe } from "@/events/broker";
import handleIncomingMessage from "@/socials/telegram/utils/incomingMessage";

export default async function main() {
  // handle commands
  await handleIncomingMessage();

  // register listeners
  subscribe("message:system", "telegram_bot", sendMessage)
  
  subscribe("message:assistant", "telegram_bot", sendMessage);
}