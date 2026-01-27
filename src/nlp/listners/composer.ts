import { publish } from "@/events/broker";
import { nlpClient } from "../client";
import { composer } from "@/nlp/utils/systemPrompt";
import { buildContext } from "../utils/context";
import { zodResponseFormat } from "openai/helpers/zod.mjs";
import z from "zod";

export async function composeEmail({ userId, emailId, userMessage, threadId }: { userId: string, emailId?: string, userMessage: string, threadId?: string }) {
  try {
    const { messages } = await buildContext({
      userId,
      systemPrompt: composer,
      userMessage,
      emailId,
      threadId
    });

    const response = await nlpClient.chat.completions.create({
      model: "gpt-4o-mini",
      messages: messages,
      response_format: zodResponseFormat(  
        z.object({  
          subject: z.string(),  
          content: z.string(),
          edited: z.string()
        }),  
        'composer'  
      ),
      temperature: 0.7,
      max_tokens: 400
    });

    const result = response.choices[0]?.message.content;

    if(!result) {
      throw new Error("Failed to get response from nlp composer");
    }

    const parsed = JSON.parse(result) as { subject: string, content: string, edited: boolean };

    if (!parsed.content) {
      throw new Error("Failed to get draft from nlp client");
    }

    if(!emailId) {
        throw new Error(`Email missing for the email to edit: ${userId}`)
    }

    if(parsed.edited) {
      await publish("email:edited", { userId, emailId, content: `${parsed.content}`, threadId })
    } else {
      await publish("email:composed", { userId, content: `${parsed.content}`, inReplyToId: emailId, threadId })
    }
  } catch (err) {
    throw new Error(`Failed to summerize email ${emailId}: ${err}`)
  }
}
