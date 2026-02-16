import { getRecentMessages } from "@/db/queries/messages";
import { ChatCompletionMessageParam } from "openai/resources";
import { decrypt } from "@/utils/encryption";
import { getEmailContent } from "../utils/helpers";
import { getUserById } from "@/db/queries/user";

export async function buildContext({ userId, ctx, userMessage, emailId, threadId }:
  { userId: string, ctx: { type: string, systemPrompt: string }, userMessage?: string, emailId?: string | null, threadId?: string | null }
) {
  const messages: ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: ctx.systemPrompt
    }
  ];

  // add user info to context
  const user = await getUserById(userId);

  if (user) {
    messages.push({
      role: "system",
      content: `# Current User\nName: ${decrypt(user.name!)}\nEmail Address:${decrypt(user.email!)}`
    })
  }

  // add email to context
  const email = emailId ? await getEmailContent(emailId) : null;

  if (email) {
    messages.push({
      role: "system",
      content: `# Email\nFrom: ${email.from}\nSubject: ${email.subject}\nBody: ${email.content}`,
    })
  }

  // add previouse messages
  const prevMessages = await getRecentMessages(userId);
  if (ctx.type != "summarizer" && prevMessages && prevMessages.length > 0) {
    for (const msg of prevMessages) {
      //associate messages with emailIds for the classifier
      const content = ctx.type == "classifier" ? `Message: ${decrypt(msg.content)}\nEmail id: ${msg.emailId}` : decrypt(msg.content) 
      messages.push({
        role: msg.role,
        content
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
