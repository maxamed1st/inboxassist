import { getTelegramUserId } from "@/db/queries/connections";
import { bot } from "@/socials/telegram/clients";
import { storeMessage } from "@/socials/telegram/utils/storeMessage";
import { ctxError } from "@/utils/errorHandling";

export async function sendMessage({ userId, content, emailId, threadId }: { userId: string, content: string, emailId?: string, threadId?: string }) {
  const telegramUser = await getTelegramUserId(userId)
  if (!telegramUser) {
    throw ctxError("sendMessage: Telegram Connection not found",
      { ctx: { userId } });
  }
  const message = await bot.telegram.sendMessage(telegramUser.id, content, { parse_mode: "Markdown" }).catch(async (err) => {
    throw ctxError("sendMessage: failed to send message to telegram user", {
      cause: { err },
      ctx: { userId, telegramUserId: telegramUser.id }
    });
  });

  if (!message) {
    throw ctxError("sendMessage: failed to send message to telegram user", {
      ctx: { userId, telegramUserId: telegramUser.id }
    });
  }

  try {
  await storeMessage(message, "assistant", emailId, threadId);
  } catch (err) {
    console.error("sendMessage: Failed to store message in database", message.message_id);
  }
}
