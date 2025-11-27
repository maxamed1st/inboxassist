import { getPreviouseMessages } from "@/db/queries/messages";
import { ChatCompletionMessageParam } from "openai/resources";
import { decrypt } from "@/utils/encryption";
import { getEmailContent } from "../utils/helpers";

export async function buildContext({ systemPrompt, userMessage, emailId, threadId }:
  { systemPrompt: string, userMessage?: string, emailId?: string | null, threadId?: string | null }
) {
  const messages: ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: systemPrompt
    }
  ];

  // add email to context
  const email = emailId ? await getEmailContent(emailId) : null;

  if (email) {
    messages.push({
      role: "user",
      content: `from: ${email.from} \n\n subject: ${email.subject} \n\n content: ${email.content}`,
    })
  }

  // add previouse messages
  const prevMessages = threadId ? await getPreviouseMessages(threadId) : null;
  if (prevMessages && prevMessages.length > 0) {
    for (const msg of prevMessages) {
      messages.push({
        role: msg.role,
        content: decrypt(msg.content)
      });
    }
  }

  // Add the current user message unless it is already included in previous messages
  if (userMessage && (!prevMessages || prevMessages.length == 0)) {
    messages.push({
      role: "user",
      content: userMessage
    });
  }

  return { messages, email }
}
