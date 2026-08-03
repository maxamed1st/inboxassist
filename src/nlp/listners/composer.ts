import { publish } from "@/events/broker";
import { nlpClient } from "@/nlp/clients";
import { composer } from "@/nlp/utils/systemPrompt";
import { buildContext } from "../utils/context";
import { zodResponseFormat } from "openai/helpers/zod.mjs";
import { decrypt } from "@/utils/encryption";
import z from "zod";
import { ctxError } from "@/utils/errorHandling";

export async function composeEmail({ userId, emailId, userMessage, threadId }: { userId: string, emailId?: string, userMessage: string, threadId?: string }) {
  try {
    const { messages, email, user } = await buildContext({
      userId,
      ctx: { type: "composer", systemPrompt: composer },
      userMessage,
      emailId,
      threadId
    });

    const response = await nlpClient.chat.completions.create({
      model: "claude-haiku-4-5-20251001",
      store: false,
      messages: messages,
      response_format: zodResponseFormat(  
        z.object({  
          subject: z.string(),  
          content: z.string(),
        }),  
        'composer'  
      ),
      temperature: 0.7,
      max_tokens: 400
    });

    const result = response.choices[0]?.message.content;

    if(!result) {
      throw ctxError("composer: Failed to get response from nlp composer", { ctx: { userId } });
    }

    const parsed = JSON.parse(result) as { subject: string, content: string };

    if (!parsed.content) {
      throw ctxError("composer: Failed to get draft from nlp client");
    }

    if(!emailId) {
        throw ctxError("comopser: Email id missing", { ctx: { userId } })
    }

    if(!email) {
        throw ctxError("composer: Failed to get email object from context builder", { ctx: { emailId } })
    }

    if(!user) {
        throw ctxError("composer: Failed to get user object from context builder", { ctx: { userId } })
    }

    if(email.from == decrypt(user.email!)) {
      await publish("email:edited", { userId, emailId, content: `${parsed.content}`, threadId })
    } else {
      await publish("email:composed", { userId, content: `${parsed.content}`, inReplyToId: emailId, subject: parsed.subject, threadId })
    }
  } catch (err) {
    throw new Error(`composer: Failed to generate email ${emailId}: ${err}`)
  }
}
