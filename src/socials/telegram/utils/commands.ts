import { telegramBotClient } from "@/socials/telegram/client";
import { connectEmail, initializeUser } from "@/socials/telegram/utils/helpers";

export default async function handleCommands() {
  const bot = telegramBotClient();
  bot.start(async (ctx) => {
    const user = await initializeUser(String(ctx.chat.id));

    switch(user.isNewUser) {
      case null:
        ctx.reply("Welcome to inboxassit - Your frictionless email assistant. Something went wrong with initializing your assistant. Please try again. \
          \n You can also use /connect to authorize your email.");
        break;
      default:
        ctx.reply("Welcome to inboxassist - Your frictionless email assist.  \n Run /connect to start managing your emails");
        break;
    }
  });

  bot.command("connect", async (ctx) => connectEmail(String(ctx.chat.id)));
}
