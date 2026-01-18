import { bot } from "@/socials/telegram/client";
import { connectEmail, disconnectEmail, initializeUser, manageSubscription, subscribe } from "@/socials/telegram/utils/helpers";
import { storeMessage } from "./storeMessage";
import { publish } from "@/events/broker";
import { message } from "telegraf/filters";
import { getUserById } from "@/db/queries/user";

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

  bot.command("subscribe", async (ctx) => subscribe(ctx.chat.id.toString()));

  bot.command("manage_subscription", async (ctx) => manageSubscription(ctx.chat.id.toString()));

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

    const user = await getUserById(message.userId);
    if(!user) {
      console.error("User not found for message:", message.id);
      return;
    }

    if(user.subscriptionStatus !== "active" && user.subscriptionStatus !== "trialing") {
      await ctx.reply(
        "Your subscription is not active. Please /subscribe to continue managing your email with the assistant."
      );
      return;
    }

    await publish("message:user", { userId: message.userId, messageId: message.id, content: ctx.message.text });
  });
}
