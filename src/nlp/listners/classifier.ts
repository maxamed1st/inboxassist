import { publish } from "@/events/broker";
import { nlpClient } from "@/nlp/clients";
import {classifier } from "@/nlp/utils/systemPrompt";
import { zodResponseFormat, } from "openai/helpers/zod.mjs";
import { z } from "zod";
import { buildContext } from "../utils/context";
import { ctxError } from "@/utils/errorHandling";

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
      model: "claude-haiku-4-5-20251001",
      store: false,
      messages: messages,
      response_format: zodResponseFormat(  
        z.object({  
          intent: z.enum(['compose', 'edit', 'send', 'move', 'toggleReadStatus', 'other']),  
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
      throw ctxError("classifier: Failed to get response from nlp classifier");
    }

    const parsed = JSON.parse(result);
    emailId = parsed.emailId ?? emailId;

    const message = parsed.intent
    if(!message) {
      throw ctxError("Failed to classify user intent", { ctx: { userId } });
    }

    if(message === "compose" || message === "edit") {
      if(!emailId) {
        throw ctxError("classifier: emailId missing for compose/edit action", { ctx: { userId, messageId } });
      }

      await publish(`action:${message as "compose" | "edit"}`, { userId, emailId, userMessage: content, threadId })
    }

    else if (message === "send") {
      if(!emailId) {
        throw ctxError("classifier: emailId missing for send action", { ctx: { userId, messageId } });
      }
      
      await publish("action:send", { userId, emailId, threadId })
    }

    else if (message === "move") {
      if(!emailId) {
        throw ctxError("classifier: emailId missing for move action", { ctx: { userId, messageId } });
      }
      
      const folder = parsed.folder;
      await publish("action:move", { userId, emailId, folder, threadId });
    } 

    else if (message === "toggleReadStatus") {
      if(!emailId) {
        throw ctxError("classifier: emailId missing for toggle action", { ctx: { userId, messageId } });
      }

      await publish("email:toggleReadStatus", { userId, emailId, threadId });
    }

    else if (message === "other") {
      await publish("action:unknown", { userId, emailId, userMessage: content, threadId });
    }

    else {
      throw ctxError ("classifier: undefined user intent", { ctx: { userId, messageId, result } });
    }
  } catch(err) {
    throw new Error(`Failed to classify user intent ${messageId}: ${err}`)
  }
}
