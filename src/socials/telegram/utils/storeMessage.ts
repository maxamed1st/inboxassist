import { getUserIdByTelegramId } from "@/db/queries/connections"
import { getMessageByPlatformMessageId, insertMessage } from "@/db/queries/messages";
import { Message } from "telegraf/types";
import { encrypt } from "@/utils/encryption";

export async function storeMessage(message: Message, role: "user" | "assistant", emailId?: string, threadId?: string) {
  try {
    //get userId from telegram user
    const telegramUserId = message.chat.id.toString();
    if (!telegramUserId) {
      throw new Error("No user ID found in message");
    }

    const user = await getUserIdByTelegramId(telegramUserId);

    if(!user) {
        throw new Error(`Could not get userID for telegram user: ${telegramUserId}`);
    }

    //extract content from message
    let content = '';

    if ('text' in message && message.text) {
      content = message.text;
    } else {
      const messageType = Object.keys(message).find(key => 
        ['text', 'photo', 'video', 'audio', 'voice', 'document', 'sticker', 'location', 'contact'].includes(key)
        ) || 'unknown';

      throw new Error(`STORETEXT: unsupported text format:", ${messageType}`);
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
      if(!threadId) {
        if(replyToDbMessage?.threadId) {
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
    
    return savedMessage;

  } catch (error) {
    console.error("Failed to store message:", error);
    return null;
  }
}
