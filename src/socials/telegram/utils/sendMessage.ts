import { getTelegramUserId } from "@/db/queries/connections";
import { telegramBotClient } from "../client";

export async function sendMessage(id: string, content: string) {
  const bot = telegramBotClient();
  const telegramUser = await getTelegramUserId(id)
  if (!telegramUser) {
    console.error("Could not find Telegram connection for:", id);
    return;
  }
  bot.telegram.sendMessage(telegramUser.id, content, { parse_mode: "HTML"}).catch(() => {
    // send message without html parsing
    bot.telegram.sendMessage(telegramUser.id, content).catch( err => {
      console.error("Failed to send message to telegram user", err);
    })
  });
}
