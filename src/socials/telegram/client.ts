import { Telegraf } from "telegraf";

export const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);
bot.launch();

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));