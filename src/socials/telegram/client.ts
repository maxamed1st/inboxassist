import { Telegraf } from "telegraf";

export function telegramBotClient() {
  const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);
  bot.launch();

  process.once("SIGINT", () => bot.stop("SIGINT"));
  process.once("SIGTERM", () => bot.stop("SIGTERM"));

  return bot;
}
