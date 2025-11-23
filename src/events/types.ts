export type Channels = 
  "message:user" | "message:assistant" | "message:system" | "message:prune" |
  "action:compose" | "action:send" | "action:edit" | "action:move" |
  "email:new" | "email:summarised" | "email:sent" | "email:moved" |
  "email:composed" | "email:edited" | "email:toggleReadStatus" |
  "email:connect" | "email:disconnect" | "email:prune" |
  "billing:subscribe" | "billing:manage";

export interface MessagePayloads {
  // chat messages
  "message:user": { id: string, content: string };
  "message:assistant": { id: string, content: string, emailId?: string, threadId?: string };
  "message:system": { id: string, content: string, threadId?: string };
  "message:prune": { userId: string };

  // user triggered actions
  "action:compose": { id: string, emailId?: string, userMessage: string, threadId?: string }; // emailId in case of composing a reply
  "action:edit": { id: string, emailId: string, userMessage: string, threadId?: string };
  "action:send": { id: string, emailId: string, threadId?: string };
  "action:move": { id: string, emailId: string, folder: string, threadId?: string };

  // email events
  "email:new": { id: string };
  "email:summarised": { id: string, content: string };
  "email:composed": { id: string, content: string, to?: string, inReplyToId?: string, threadId?: string };
  "email:edited": { id: string, content: string };
  "email:sent": { id: string };
  "email:moved": { id: string };
  "email:toggleReadStatus": { userId: string, emailId: string, threadId?: string }
  "email:connect": { userId: string, platform: string };
  "email:disconnect": { userId: string };
  "email:prune": { userId: string };

  // Billing events
  "billing:subscribe": { userId: string };
  "billing:manage": { userId: string };
}
