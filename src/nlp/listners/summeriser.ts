import { publish } from "@/events/broker";
import { nlpClient } from "../client";
import { storeSummary } from "@/nlp/utils/helpers";
import { summerizer } from "@/nlp/utils/systemPrompt";
import { buildContext } from "../utils/context";

export async function summerizeEmail({ userId, emailId }: { userId: string, emailId: string }) {
  try {
    const { messages, email } = await buildContext({
      userId,
      systemPrompt: summerizer,
      emailId
    })

    const response = await nlpClient.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.3,
      max_tokens: 200
    });

    const summary = response.choices[0]?.message.content;

    if (!summary) {
      throw new Error("Failed to get summary from nlp client");
    }

    await storeSummary(emailId, summary);

    if(!email) {
      throw new Error(`Summerizer: email from context builder is null: ${emailId}`);
    }

    publish("message:assistant", { id: userId, emailId, content: `${email.from.replace(/['"]/g, '')} \n\n ${summary}` })
  } catch (err) {
    throw new Error(`Failed to summerize email ${emailId}: ${err}`)
  }
}
