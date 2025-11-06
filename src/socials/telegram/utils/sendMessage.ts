import { getTelegramUserId } from "@/db/queries/connections";
import { Context, Telegraf } from "telegraf";
import { Update } from "telegraf/types";

export async function sendMessage(bot: Telegraf<Context<Update>>, id: string, content: string) {
    const telegramUser = await getTelegramUserId(id)
    if (!telegramUser) {
      console.error("Could not find Telegram connection for:", id);
      return;
    }
    bot.telegram.sendMessage(telegramUser.id, content);
}