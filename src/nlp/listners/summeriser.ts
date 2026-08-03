import { publish } from "@/events/broker";
import { nlpClient } from "@/nlp/clients";
import { storeSummary } from "@/nlp/utils/helpers";
import { summerizer } from "@/nlp/utils/systemPrompt";
import { buildContext } from "../utils/context";
import { ctxError } from "@/utils/errorHandling";

export async function summerizeEmail({ userId, emailId }: { userId: string, emailId: string }) {
  try {
    const { messages, email } = await buildContext({
      userId,
      ctx: { type: "summarizer", systemPrompt: summerizer },
      emailId
    })

    const response = await nlpClient.chat.completions.create({
      model: "claude-haiku-4-5-20251001",
      store: false,
      messages,
      temperature: 0.3,
      max_tokens: 200
    });

    const summary = response.choices[0]?.message.content;

    if (!summary) {
      throw ctxError("summarizer: Failed to get summary from nlp client", { ctx: { emailId } });
    }

    await storeSummary(emailId, summary);

    if(!email) {
      throw ctxError("summarizer: email from context builder is null", { ctx: { emailId } });
    }

    publish("message:assistant", { userId: userId, emailId, content: `${email.from.replace(/['"]/g, '')} \n\n ${summary}` })
  } catch (err) {
    throw new Error(`Failed to summerize email ${emailId}: ${err}`)
  }
}
