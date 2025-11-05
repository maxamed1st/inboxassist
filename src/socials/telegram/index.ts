import { telegramBotClient } from "@/socials/telegram/client";
import { connectEmail, initializeUser, sendMessage } from "@/socials/telegram/utils";
import { subscribe } from "@/events/broker";

export default async function main() {
  const bot = telegramBotClient();
  bot.start(async (ctx) => {
    await initializeUser(String(ctx.chat.id));
    ctx.reply("Welcome to inboxAssist - Your frictionless email assist.\n Run /connect to connect your email")
  });

  bot.command("connect", async (ctx) => connectEmail(String(ctx.chat.id)));

  await subscribe("message:system", "telegram_bot", async ({id, content}) => {
    sendMessage(bot, id, content);
  })
  
  await subscribe("message:assistant", "telegram_bot", async ({id, content}) => {
    sendMessage(bot, id, content);
  })
}