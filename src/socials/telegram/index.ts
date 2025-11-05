import { telegramBotClient } from "@/socials/telegram/client";
import { initializeUser } from "@/socials/telegram/utils";

export default async function main() {
  const bot = telegramBotClient();
  bot.start(async (ctx) => {
    await initializeUser(String(ctx.chat.id));
    ctx.reply("Welcome to inboxAssist - Your frictionless email assist.\n Run /connect to connect your email")
  });
}