import { getPreviouseMessages } from "@/db/queries/messages";
import { ChatCompletionMessageParam } from "openai/resources";
import { decrypt } from "@/utils/encryption";
import { getEmailContent } from "../utils/helpers";
import { getUserById } from "@/db/queries/user";

export async function buildContext({ userId, systemPrompt, userMessage, emailId, threadId }:
  { userId?: string, systemPrompt: string, userMessage?: string, emailId?: string | null, threadId?: string | null }
) {
  const messages: ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: systemPrompt
    }
  ];

  // add user info to context
  const user = userId ? await getUserById(userId): null;

  if(user) {
    messages.push({
      role: "system",
      content: `Corrent User:\nDisplay name: ${decrypt(user.name!)}\nEmail Address:${decrypt(user.email!)}`
    })
  }

  // add email to context
  const email = emailId ? await getEmailContent(emailId) : null;

  if (email) {
    messages.push({
      role: "system",
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

  return { messages, email, user }
}
