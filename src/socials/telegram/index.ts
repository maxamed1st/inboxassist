import { telegramBotClient } from "./client";

export default function main() {
  const bot = telegramBotClient();
  bot.start((ctx) => ctx.reply("Hello, Walaalka!"));
}
