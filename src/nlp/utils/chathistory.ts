import { ChatCompletionMessageParam } from "openai/resources";
import { getMessageById, getRecentMessages } from "@/db/queries/messages";
import { decrypt } from "@/utils/encryption";

export async function constructChatHistory({ userId, userMessage, ctxType, messages }:
  { userId: string, userMessage?: string, ctxType: string, messages: ChatCompletionMessageParam[] }
) {
  // No chathistory needed for the summarizer
  if (ctxType == "summarizer") return messages;

  const prevMessages = await getRecentMessages(userId);

  if (!prevMessages) {
    if (userMessage) {
      messages.push({
        role: "user",
        content: userMessage
      })
    }
    return messages;
  }

  //associate messages with emailIds for the classifier
  const constructContent = (m: typeof prevMessages[0]) => ctxType == "classifier" ? `Message: ${decrypt(m.content)}\nEmail id: ${m.emailId}` : decrypt(m.content)

  const currentMessage = prevMessages.pop()

  for (const msg of prevMessages) {
    messages.push({
      role: msg.role,
      content: constructContent(msg)
    });
  }

  const replyToMessage = currentMessage?.replyToId ? await getMessageById(currentMessage.replyToId) : null;
  if (replyToMessage) {
    messages.push({
      role: "system",
      content: `The following message is a reply to: ${constructContent(replyToMessage)}`
    })
  }

  if (currentMessage) {
    messages.push({
      role: "user",
      content: constructContent(currentMessage)
    })
  } else if (userMessage) {
    messages.push({
      role: "user",
      content: userMessage
    })
  } else {
    console.error(`contextBuilder: current message is missing from chathistory for ${userId}`)
  }

  return messages
}
