import { getTelegramUserId } from "@/db/queries/connections";
import { bot } from "@/socials/telegram/client";
import { storeMessage } from "./storeMessage";

export async function sendMessage(id: string, content: string) {
  const telegramUser = await getTelegramUserId(id)
  if (!telegramUser) {
    console.error("Could not find Telegram connection for:", id);
    return;
  }
  const message = await bot.telegram.sendMessage(telegramUser.id, content, { parse_mode: "HTML"}).catch( async () => {
    // send message without html parsing
    return bot.telegram.sendMessage(telegramUser.id, content).catch( err => {
      console.error("Failed to send message to telegram user", err);
    })
  });

  if (!message) {
    console.error("Failed to send message to telegram user");
    return;
  }

  const storedMessage = await storeMessage(message, "assistant");

  if (!storedMessage) {
    console.error("Failed to store message in database");
  }
}
