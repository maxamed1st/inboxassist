import { publish } from "@/events/broker";
import { nlpClient } from "../client";
import { getEmailContent, storeSummary } from "./helpers";
import {classifier, summerizer } from "./systemPrompt";
import { getMessageById } from "@/db/queries/messages";
import { zodResponseFormat, } from "openai/helpers/zod.mjs";
import { z } from "zod";

export async function summerizeEmail({ id }: { id: string }) {
  try {
  const { userId, emailId, from, subject, content } = await getEmailContent(id);
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

  const summary = response.choices[0]?.message.content;

  if(!summary) {
    throw new Error("Failed to get summary from nlp client");
  }

  await storeSummary(emailId, summary);

  publish("message:assistant", { id: userId, emailId, content: `${from.replace(/['"]/g, '')} \n\n ${summary}` })
  } catch(err) {
    throw new Error(`Failed to summerize email ${id}: ${err}`)
  }
}

export async function classifyUserIntent({ id, content }: { id: string, content: string }) {
  try {
    const response = await nlpClient.chat.completions.create({
      model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: classifier
          },
          {
            role: "user",
            content: content
          }
        ],
      response_format: zodResponseFormat(  
        z.object({  
          category: z.enum(['compose', 'edit', 'send', 'move', 'other']),  
          folder: z.string().optional().nullable()  
        }),  
        'classification'  
      ),
      temperature: 0.2,
      max_tokens: 20
    });

    const result = response.choices[0]?.message.content;

    if(!result) {
      throw new Error("Failed to get response from nlp classifier");
    }

    const parsed = JSON.parse(result);

    const message = parsed.category
    if(!message) {
      throw new Error("Failed to classify user intent");
    }

    const userMessage = await getMessageById(id);
    if(!userMessage) {
      throw new Error("Failed to fetch user message");
    }

    const emailId = userMessage.emailId

    if(message === "compose" || message === "edit") {
      if(!emailId) {
        throw new Error(`EmailId missing for compose action ${id}`);
      }

      publish("action:compose", { id, emailId, userMessage: content })
    }

    else if (message === "send") {
      if(!emailId) {
        throw new Error(`EmailId missing for compose action ${id}`);
      }
      
      publish("action:send", { id, emailId })
    }

    else if (message === "move") {
      if(!emailId) {
        throw new Error(`EmailId missing for compose action ${id}`);
      }
      
      const folder = parsed.folder;
      publish("action:move", { id, emailId, folder });
    } 

    else {
      console.log("undefined user intent", result);
    }
  } catch(err) {
    throw new Error(`Failed to classify user intent ${id}: ${err}`)
  }
}
