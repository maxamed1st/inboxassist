import { getPreviouseMessages } from "@/db/queries/messages";
import { publish } from "@/events/broker";
import { nlpClient } from "@/nlp/client";
import { getEmailContent } from "@/nlp/utils/helpers";
import { generic } from "@/nlp/utils/systemPrompt";
import { decrypt } from "@/utils/encryption";
import { ChatCompletionMessageParam } from "openai/resources";

export async function genericGPT({ userId, emailId, userMessage, threadId }: { userId: string, emailId?: string, userMessage: string, threadId?: string }) {
  try {
    const messages: ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: generic
      }
    ];
    // add email as contenxt
    const email = emailId ? await getEmailContent(emailId) : null;
    email && messages.push({
      role: "user",
      content: `from: ${email.from} \n\n subject: ${email.subject} \n\n content: ${email.content}`
    });

    // add previouse messages to context
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
      content: userMessage
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
