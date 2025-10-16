export type Channels = 
  "message:user" | "message:assistant" | "message:system" | "message:prune" |
  "action:compose" | "action:send" | "action:edit" | "action:move" |
  "email:new" | "email:summarised" | "email:sent" | "email:moved" |
  "email:composed" | "email:edited" |
  "email:login" | "email:logout" | "email:prune" |
  "billing:balance" | "billing:buy";

export interface MessagePayloads {
  // chat messages
  "message:user": { id: number, content: string };
  "message:assistant": { id: number, content: string };
  "message:system": { id: number, content: string };
  "message:prune": { userId: number };

  // user triggered actions
  "action:compose": { id: number, emailId?: number, userMessage: string, usage: number }; // emailId in case of composing a reply
  "action:edit": { id: number, emailId: number, userMessage: string, usage: number };
  "action:send": { id: number, emailId: number, usage: number };
  "action:move": { id: number, emailId: number, folder: string, usage: number };

  // email events
  "email:new": { id: number };
  "email:summarised": { id: number, content: string, usage: number };
  "email:composed": { id: number, content: string, usage: number };
  "email:edited": { id: number, content: string, usage: number };
  "email:sent": { id: number, usage: number };
  "email:moved": { id: number, usage: number };
  "email:login": { userId: number, platform: string };
  "email:logout": { userId: number };
  "email:prune": { userId: number };

  // Billing events
  "billing:balance": { userId: number };
  "billing:buy": { userId: number };
}