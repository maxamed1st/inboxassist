import { publish } from "@/events/broker";
import { nlpClient } from "@/nlp/client";
import {classifier } from "@/nlp/utils/systemPrompt";
import { getMessageById, getPreviouseMessages } from "@/db/queries/messages";
import { zodResponseFormat, } from "openai/helpers/zod.mjs";
import { z } from "zod";
import { decrypt } from "@/utils/encryption";
import { ChatCompletionMessageParam } from "openai/resources";

export async function classifyUserIntent({ id, content }: { id: string, content: string }) {
  try {
    const userMessage = await getMessageById(id);
    if(!userMessage) {
      throw new Error("Failed to fetch user message");
    }

    const messages: ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: classifier
      }
    ];

    const threadId = userMessage.threadId ?? undefined;
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
      content: content
    });

    const response = await nlpClient.chat.completions.create({
      model: "gpt-4o-mini",
        messages: messages,
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

    const emailId = userMessage.emailId

    if(message === "compose" || message === "edit") {
      if(!emailId) {
        throw new Error(`EmailId missing for compose/edit action ${id}`);
      }

      publish("action:compose", { id, emailId, userMessage: content, threadId })
    }

    else if (message === "send") {
      if(!emailId) {
        throw new Error(`EmailId missing for send action ${id}`);
      }
      
      publish("action:send", { id, emailId, threadId })
    }

    else if (message === "move") {
      if(!emailId) {
        throw new Error(`EmailId missing for move action ${id}`);
      }
      
      const folder = parsed.folder;
      publish("action:move", { id, emailId, folder, threadId });
    } 

    else {
      console.log("undefined user intent", result);
    }
  } catch(err) {
    throw new Error(`Failed to classify user intent ${id}: ${err}`)
  }
}
