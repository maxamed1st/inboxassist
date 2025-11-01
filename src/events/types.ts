export type Channels = 
  "message:user" | "message:assistant" | "message:system" | "message:prune" |
  "action:compose" | "action:send" | "action:edit" | "action:move" |
  "email:new" | "email:summarised" | "email:sent" | "email:moved" |
  "email:composed" | "email:edited" |
  "email:login" | "email:logout" | "email:prune" |
  "billing:balance" | "billing:buy";

export interface MessagePayloads {
  // chat messages
  "message:user": { id: string, content: string };
  "message:assistant": { id: string, content: string };
  "message:system": { id: string, content: string };
  "message:prune": { userId: string };

  // user triggered actions
  "action:compose": { id: string, emailId?: string, userMessage: string, usage: number }; // emailId in case of composing a reply
  "action:edit": { id: string, emailId: string, userMessage: string, usage: number };
  "action:send": { id: string, emailId: string, usage: number };
  "action:move": { id: string, emailId: string, folder: string, usage: number };

  // email events
  "email:new": { id: string };
  "email:summarised": { id: string, content: string, usage: number };
  "email:composed": { id: string, content: string, usage: number };
  "email:edited": { id: string, content: string, usage: number };
  "email:sent": { id: string, usage: number };
  "email:moved": { id: string, usage: number };
  "email:login": { userId: string, platform: string };
  "email:logout": { userId: string };
  "email:prune": { userId: string };

  // Billing events
  "billing:balance": { userId: string };
  "billing:buy": { userId: string };
}
