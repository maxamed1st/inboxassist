import { publish } from "@/events/broker";
import { nlpClient } from "@/nlp/clients";
import {classifier } from "@/nlp/utils/systemPrompt";
import { zodResponseFormat, } from "openai/helpers/zod.mjs";
import { z } from "zod";
import { buildContext } from "../utils/context";

export async function classifyUserIntent({ userId, messageId, content, emailId, threadId }: { userId: string, messageId: string, content: string, emailId?: string, threadId?: string }) {
  try {
    const { messages } = await buildContext({
      userId,
      ctx: { type: "classifier", systemPrompt: classifier },
      userMessage: content,
      emailId,
      threadId
    });

    const response = await nlpClient.chat.completions.create({
      model: "gpt-4o-mini",
      store: false,
      messages: messages,
      response_format: zodResponseFormat(  
        z.object({  
          category: z.enum(['compose', 'edit', 'send', 'move', 'toggleReadStatus', 'other']),  
          emailId: z.string().optional().nullable(),
          folder: z.string().optional().nullable()  
        }),  
        'classification'  
      ),
      temperature: 0.2,
      max_tokens: 50
    });

    const result = response.choices[0]?.message.content;

    if(!result) {
      throw new Error("Failed to get response from nlp classifier");
    }

    const parsed = JSON.parse(result);
    emailId = parsed.emailId ?? emailId;

    const message = parsed.category
    if(!message) {
      throw new Error("Failed to classify user intent");
    }

    if(message === "compose" || message === "edit") {
      if(!emailId) {
        throw new Error(`EmailId missing for compose/edit action ${messageId}`);
      }

      await publish(`action:${message as "compose" | "edit"}`, { userId, emailId, userMessage: content, threadId })
    }

    else if (message === "send") {
      if(!emailId) {
        throw new Error(`EmailId missing for send action ${messageId}`);
      }
      
      await publish("action:send", { userId, emailId, threadId })
    }

    else if (message === "move") {
      if(!emailId) {
        throw new Error(`EmailId missing for move action ${messageId}`);
      }
      
      const folder = parsed.folder;
      await publish("action:move", { userId, emailId, folder, threadId });
    } 

    else if (message === "toggleReadStatus") {
      if(!emailId) {
        throw new Error(`EmailId missing for toggle action ${messageId}`);
      }

      await publish("email:toggleReadStatus", { userId, emailId, threadId });
    }

    else if (message === "other") {
      await publish("action:unknown", { userId, emailId, userMessage: content, threadId });
    }

    else {
      throw new Error (`undefined user intent: ${result}`);
    }
  } catch(err) {
    throw new Error(`Failed to classify user intent ${messageId}: ${err}`)
  }
}
