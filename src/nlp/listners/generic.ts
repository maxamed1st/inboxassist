import { publish } from "@/events/broker";
import { nlpClient } from "@/nlp/client";
import { getEmailContent } from "@/nlp/utils/helpers";
import { generic } from "@/nlp/utils/systemPrompt";

export async function genericGPT({ userId, emailId, userMessage, threadId }: { userId: string, emailId?: string, userMessage: string, threadId?: string }) {
  try {
    const userMessage = await getMessageById(id);
    if(!userMessage) {
      throw new Error("Failed to fetch user message");
    }

    const messages: ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: generic
      }
    ];
    // add email as contenxt
    const { from, subject, content } = emailId ? await getEmailContent(emailId) : null;
    messages.push({
      role: "user",
      content: `from: ${from} \n\n subject: ${subject} \n\n content: ${content}`
    });

    // add previouse messages to context
    const threadId = userMessage.threadId ?? undefined;
    const prevMessages = threadId ? await getPreviouseMessages(threadId): null;
    if(prevMessages && prevMessages.length > 0) {
      for(const msg of prevMessages) {
        messages.push({
          role: msg.role,
          content: decrypt(msg.content)
        });
      }
    }

    // Add the current user message unless it is already included in previous messages
    (!prevMessages || prevMessages.length == 0) && messages.push({
      role: "user",
      content: content
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

  publish("message:assistant", { id: userId, emailId, content: message })
  } catch(err) {
    throw new Error(`Failed to respond to a generic query from ${userId}: ${err}`)
  }
}
