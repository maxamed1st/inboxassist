export type Channels = 
  "message:user" | "message:assistant" | "message:system" | "message:prune" |
  "action:compose" | "action:send" | "action:edit" | "action:move" |
  "email:new" | "email:summerised" | "email:sent" | "email:moved" |
  "email:composed" | "email:edited" |
  "email:login" | "email:logout" | "email:prune" |
  "billing:balance" | "billing:buy";

export interface MessagePayloads {
  // user messages
  "message:user": { id: number, content: string };
  "message:assistant": { id: number, content: string };
  "message:system": { id: number, content: string };

  // user triggered actions
  "action:compose": { id: number, inReplyTo?: string, userMessage: string, usage: number };
  "action:edit": { id: number, emailId:string, userMessage: string, usage: number };
  "action:send": { id: number, usage: number };
  "action:move": { id: number, emailId: string, folder: string, usage: number };

  // email events
  "email:new": { id: number };
  "email:summarised": { id: number, content: string, usage: number };
  "email:composed": { id: number, content: string, usage: number };
  "email:edited": { id: number, content: string, usage: number };
  "email:sent": { id: number, usage: number };
  "email:moved": { id: number, usage: number };
}