import { getUserIdByTelegramId } from "@/db/queries/connections"
import { getMessageByPlatformMessageId, insertMessage } from "@/db/queries/messages";
import { Message } from "telegraf/types";
import { encrypt } from "@/utils/encryption";
import { ctxError } from "@/utils/errorHandling";

export async function storeMessage(message: Message, role: "user" | "assistant", emailId?: string, threadId?: string) {
  //get userId from telegram user
  const telegramUserId = message.chat.id.toString();
  if (!telegramUserId) {
    throw ctxError("storeMessage: No user ID found in message", { ctx: { messageId: message.message_id } });
  }

  const user = await getUserIdByTelegramId(telegramUserId);

  if (!user) {
    throw ctxError("storeMessage: userId not found for telegram user", { ctx: { telegramUserId } });
  }

  //extract content from message
  let content = '';

  if ('text' in message && message.text) {
    content = message.text;
  } else {
    const messageType = Object.keys(message).find(key =>
      ['text', 'photo', 'video', 'audio', 'voice', 'document', 'sticker', 'location', 'contact'].includes(key)
    ) || 'unknown';

    throw ctxError("storeMessage: unsupported text format:", { ctx: { messageId: message.message_id, messageType } });
  }

  // Handle reply_to
  let replyToId: string | null = null;

  if ('reply_to_message' in message && message.reply_to_message) {
    const replyToDbMessage = await getMessageByPlatformMessageId(user.id, message.reply_to_message.message_id.toString());

    if (replyToDbMessage?.id) {
      replyToId = replyToDbMessage.id;
    }

    // keep track of email message is concerning
    if (!emailId && replyToDbMessage?.emailId) {
      emailId = replyToDbMessage.emailId;
    }

    // inherit thread id
    if (!threadId) {
      if (replyToDbMessage?.threadId) {
        threadId = replyToDbMessage.threadId
      } else {
        threadId = replyToDbMessage?.id
      }
    }
  }

  //prepare message data
  const messageDate = new Date(message.date);

  const messageData = {
    platformMessageId: message.message_id.toString(),
    userId: user.id,
    emailId,
    replyToId,
    threadId,
    content: encrypt(content),
    role,
    createdAt: messageDate,
    updatedAt: messageDate,
  };

  //Insert into database
  const savedMessage = await insertMessage(messageData);

  if(!savedMessage) {
    throw ctxError("storeMessage: Failed to persist message", { ctx: { messageId: message.message_id } })
  }

  return savedMessage;
} 
