import { ChatCompletionMessageParam } from "openai/resources";
import { decrypt } from "@/utils/encryption";
import { getEmailContent } from "../utils/helpers";
import { getUserById } from "@/db/queries/user";
import { constructChatHistory } from "./chathistory";
import { ctxError } from "@/utils/errorHandling";

export async function buildContext({ userId, ctx, userMessage, emailId, threadId }:
  { userId: string, ctx: { type: string, systemPrompt: string }, userMessage?: string, emailId?: string | null, threadId?: string | null }
) {
  let messages: ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: ctx.systemPrompt
    }
  ];

  // add user info to context
  const user = await getUserById(userId);
  if (!user) throw ctxError("User not found", { ctx: { userId } })

  messages.push({
    role: "system",
    content: `# Current User\nName: ${decrypt(user.name!)}\nEmail Address:${decrypt(user.email!)}`
  })

  // add email to context
  const email = emailId ? await getEmailContent(emailId) : null;

  if (email) {
    messages.push({
      role: ctx.type == "summarizer" ? "user" : "system",
      content: `# Email\nFrom: ${email.from}\nSubject: ${email.subject}\nBody: ${email.content}`,
    })
  }

  // construct chat history
  messages = await constructChatHistory({ userId, userMessage, ctxType: ctx.type, messages })

  return { messages, email, user }
}
