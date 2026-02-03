import { publish } from "@/events/broker";
import { nlpClient } from "@/nlp/clients";
import { generic } from "@/nlp/utils/systemPrompt";
import { buildContext } from "../utils/context";

export async function genericGPT({ userId, emailId, userMessage, threadId }: { userId: string, emailId?: string, userMessage: string, threadId?: string }) {
  try {
    const { messages } = await buildContext({
      userId,
      systemPrompt: generic,
      userMessage,
      emailId,
      threadId
      });
    
    const response = await nlpClient.chat.completions.create({
      model: "gpt-4o-mini",
      messages: messages,
        temperature: 0.7,
        max_tokens: 250
    });

  const message = response.choices[0]?.message.content;

  if(!message) {
    throw new Error("Failed to get generic response from nlp client");
  }

  publish("message:assistant", { userId: userId, emailId, content: message })
  } catch(err) {
    throw new Error(`Failed to respond to a generic query from ${userId}: ${err}`)
  }
}
