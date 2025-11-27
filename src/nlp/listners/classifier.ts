import { publish } from "@/events/broker";
import { nlpClient } from "@/nlp/client";
import {classifier } from "@/nlp/utils/systemPrompt";
import { getMessageById } from "@/db/queries/messages";
import { zodResponseFormat, } from "openai/helpers/zod.mjs";
import { z } from "zod";
import { buildContext } from "../utils/context";

export async function classifyUserIntent({ id, content }: { id: string, content: string }) {
  try {
    const userMessage = await getMessageById(id);
    if(!userMessage) {
      throw new Error("Failed to fetch user message");
    }

    const emailId = userMessage.emailId ?? undefined;
    const threadId = userMessage.threadId ?? undefined;

    const { messages } = await buildContext({
      systemPrompt: classifier,
      userMessage: content,
      emailId,
      threadId
    });

    const response = await nlpClient.chat.completions.create({
      model: "gpt-4o-mini",
        messages: messages,
      response_format: zodResponseFormat(  
        z.object({  
          category: z.enum(['compose', 'edit', 'send', 'move', 'toggleReadStatus', 'other']),  
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


    if(message === "compose" || message === "edit") {
      if(!emailId) {
        throw new Error(`EmailId missing for compose/edit action ${id}`);
      }

      await publish(`action:${message as "compose" | "edit"}`, { id: userMessage.userId, emailId, userMessage: content, threadId })
    }

    else if (message === "send") {
      if(!emailId) {
        throw new Error(`EmailId missing for send action ${id}`);
      }
      
      await publish("action:send", { id: userMessage.userId, emailId, threadId })
    }

    else if (message === "move") {
      if(!emailId) {
        throw new Error(`EmailId missing for move action ${id}`);
      }
      
      const folder = parsed.folder;
      await publish("action:move", { id: userMessage.userId, emailId, folder, threadId });
    } 

    else if (message === "toggleReadStatus") {
      if(!emailId) {
        throw new Error(`EmailId missing for move action ${id}`);
      }

      await publish("email:toggleReadStatus", { userId: userMessage.userId, emailId, threadId });
    }

    else if (message === "other") {
      await publish("action:unknown", { userId: userMessage.userId, emailId, userMessage: content, threadId });
    }

    else {
      console.log("undefined user intent", result);
    }
  } catch(err) {
    throw new Error(`Failed to classify user intent ${id}: ${err}`)
  }
}
