import { getTelegramUserId } from "@/db/queries/connections";
import { bot } from "@/socials/telegram/client";
import { storeMessage } from "./storeMessage";

export async function sendMessage({ id, content, emailId }: { id: string, content: string, emailId?: string }) {
  const telegramUser = await getTelegramUserId(id)
  if (!telegramUser) {
    console.error("Could not find Telegram connection for:", id);
    return;
  }
  const message = await bot.telegram.sendMessage(telegramUser.id, content, { parse_mode: "Markdown"}).catch( async (err) => {
    throw new Error(`Failed to send message to telegram user: ${err}`);
    });

  if (!message) {
    throw new Error("Failed to send message to telegram user");
  }

  const storedMessage = await storeMessage(message, "assistant", emailId);

  if (!storedMessage) {
    console.error("Failed to store message in database");
    return;
  }
}