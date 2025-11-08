import { bot } from "@/socials/telegram/client";
import { connectEmail, initializeUser } from "@/socials/telegram/utils/helpers";
import { storeMessage } from "./storeMessage";

export default async function handleCommands() {
  bot.start(async (ctx) => {
    // store user message
    await storeMessage(ctx.message, "user");

    const user = await initializeUser(ctx.from.id.toString() || ctx.chat.id.toString());

    let messageText;
    switch(user.isNewUser) {
      case null:
        messageText = "Welcome to inboxassit - Your frictionless email assistant. Something went wrong with initializing your assistant. Please try again. \
          \n You can also use /connect to authorize your email.";
        break;
      default:
        messageText = "Welcome to inboxassist - Your frictionless email assist.  \n Run /connect to start managing your emails";
        break;
    }
    const message = await ctx.reply(messageText);
    await storeMessage(message, "system");
  });

  bot.command("connect", async (ctx) => connectEmail(ctx.from.id.toString() || ctx.chat.id.toString()));
}
