import { telegramBotClient } from "@/socials/telegram/client";
import { connectEmail, initializeUser } from "@/socials/telegram/utils/listners";
import { sendMessage } from "@/socials/telegram/utils/sendMessage"
import { subscribe } from "@/events/broker";

export default async function main() {
  const bot = telegramBotClient();
  bot.start(async (ctx) => {
    await initializeUser(String(ctx.chat.id));
    ctx.reply("Welcome to inboxAssist - Your frictionless email assist.\n Run /connect to connect your email")
  });

  bot.command("connect", async (ctx) => connectEmail(String(ctx.chat.id)));

  subscribe("message:system", "telegram_bot", async ({id, content}) => {
    sendMessage(bot, id, content);
  })
  
  subscribe("message:assistant", "telegram_bot", async ({id, content}) => {
    sendMessage(bot, id, content);
  })
}