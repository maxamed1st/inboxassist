import { publish } from "@/events/broker";
import { nlpClient } from "@/nlp/clients";
import { generic } from "@/nlp/utils/systemPrompt";
import { buildContext } from "../utils/context";
import { ctxError } from "@/utils/errorHandling";

export async function genericGPT({ userId, emailId, userMessage, threadId }: { userId: string, emailId?: string, userMessage: string, threadId?: string }) {
  const { messages } = await buildContext({
    userId,
    ctx: { type: "generic", systemPrompt: generic },
    userMessage,
    emailId,
    threadId
  });

  const response = await nlpClient.chat.completions.create({
    model: "claude-haiku-4-5-20251001",
    store: false,
    messages: messages,
    temperature: 0.7,
    max_tokens: 250
  });

  const message = response.choices[0]?.message.content;

  if (!message) {
    throw ctxError("nlpgeneric: Failed to get response from nlp client", { ctx: { userId } });
  }

  publish("message:assistant", { userId: userId, emailId, content: message })
}
