import { publish } from "@/events/broker";
import { nlpClient } from "../client";
import { composer } from "@/nlp/utils/systemPrompt";
import { buildContext } from "../utils/context";

export async function composeEmail({ id, emailId, userMessage, threadId }: { id: string, emailId?: string, userMessage: string, threadId?: string }) {
  try {
    const { messages, email } = await buildContext({
      systemPrompt: composer,
      userMessage,
      emailId,
      threadId
    });

    const response = await nlpClient.chat.completions.create({
      model: "gpt-4o-mini",
      messages: messages,
      temperature: 0.7,
      max_tokens: 400
    });

    const draft = response.choices[0]?.message.content;

    if (!draft) {
      throw new Error("Failed to get draft from nlp client");
    }

    publish("email:composed", { id: id, content: `${draft}`, to: email?.from, inReplyToId: emailId, threadId })
  } catch (err) {
    throw new Error(`Failed to summerize email ${id}: ${err}`)
  }
}
