import { bot } from "@/socials/telegram/client";
import { connectEmail, disconnectEmail, initializeUser } from "@/socials/telegram/utils/helpers";
import { storeMessage } from "./storeMessage";
import { publish } from "@/events/broker";
import { message } from "telegraf/filters";

export default async function handleIncomingMessage() {
  bot.start(async (ctx) => {

    const user = await initializeUser(ctx.chat.id.toString());

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
    await ctx.reply(messageText);
  });

  bot.command("connect", async (ctx) => connectEmail(ctx.chat.id.toString()));

  bot.command("disconnect", async (ctx) => disconnectEmail(ctx.chat.id.toString()));

  bot.on(message("text"), async (ctx) => {
    // store user message
    let message;

    try {
      message = await storeMessage(ctx.message, "user");
    } catch (err) {
      console.error("Failed to store message in database:", err);
    }
    if(!message) {
      console.error("Failed to store message in database");
      return;
    }

    publish("message:user", { id: message.id, content: ctx.message.text });
  });
}
