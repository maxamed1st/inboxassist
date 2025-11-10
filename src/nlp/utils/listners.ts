import { publish } from "@/events/broker";
import { nlpClient } from "../client";
import { getEmailContent } from "./helpers";
import { summerizer } from "./systemPrompt";

export async function summerizeEmail({ id }: { id: string }) {
  try {
  const { userId, from, subject, content } = await getEmailContent(id);
  const response = await nlpClient.chat.completions.create({
    model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: summerizer
        },
        {
          role: "user",
          content: `from: ${from} \n\n subject: ${subject} \n\n content: ${content}`
        }
      ],
      temperature: 0.3,
      max_tokens: 200
  });

  const message = response.choices[0]?.message.content;

  if(!message) {
    throw new Error("Failed to get summary from nlp client");
  }

  publish("message:assistant", { id: userId, content: `${from.replace(/['"]/g, '')} \n\n ${message}` })
  } catch(err) {
    throw new Error(`Failed to summerize email ${id}: ${err}`)
  }
}