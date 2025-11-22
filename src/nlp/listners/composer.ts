import { publish } from "@/events/broker";
import { nlpClient } from "../client";
import { composer } from "@/nlp/utils/systemPrompt";
import { getPreviouseMessages } from "@/db/queries/messages";
import { ChatCompletionMessageParam } from "openai/resources";
import { decrypt } from "@/utils/encryption";
import { getEmailContent } from "../utils/helpers";

export async function composeEmail({ id, emailId, userMessage, threadId }: { id: string, emailId?: string, userMessage: string, threadId?: string }) {
  try {
    const messages: ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: composer
      }
    ];

    // add email to context
    const email = emailId ? await getEmailContent(emailId) : null;

    if(email) {
      messages.push({
        role: "system",
        content: `from: ${email.from} \n\n subject: ${email.subject} \n\n content: ${email.content}`,
      })
    }

    // add previouse messages
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
      max_tokens: 400
  });

  const draft = response.choices[0]?.message.content;

  if(!draft) {
    throw new Error("Failed to get draft from nlp client");
  }

  publish("message:user", { id: id, content: `${draft}` })
  } catch(err) {
    throw new Error(`Failed to summerize email ${id}: ${err}`)
  }
}
