export type Channels = 
  "message:user" | "message:assistant" | "message:system" | "message:prune" |
  "action:compose" | "action:send" | "action:edit" | "action:move" | "action:unknown" |
  "email:new" | "email:composed" | "email:edited" | "email:toggleReadStatus" |
  "email:connect" | "email:disconnect" | "email:prune" |
  "billing:subscribe" | "billing:manage";

export interface MessagePayloads {
  // chat messages
  "message:user": { userId: string, messageId: string, content: string };
  "message:assistant": { userId: string, content: string, emailId?: string, threadId?: string };
  "message:system": { userId: string, content: string, threadId?: string };
  "message:prune": { userId: string };

  // user triggered actions
  "action:compose": { userId: string, emailId?: string, userMessage: string, threadId?: string }; // emailId in case of composing a reply
  "action:edit": { userId: string, emailId: string, userMessage: string, threadId?: string };
  "action:send": { userId: string, emailId: string, threadId?: string };
  "action:move": { userId: string, emailId: string, folder: string, threadId?: string };
  "action:unknown": { userId: string, emailId?: string, userMessage: string, threadId?: string };

  // email events
  "email:new": { userId: string, emailId: string };
  "email:composed": { userId: string, content: string, inReplyToId?: string, threadId?: string };
  "email:edited": { userId: string, emailId: string, content: string,  threadId?: string };
  "email:toggleReadStatus": { userId: string, emailId: string, threadId?: string }
  "email:connect": { userId: string, platform: string };
  "email:disconnect": { userId: string };
  "email:prune": { userId: string };

  // Billing events
  "billing:subscribe": { userId: string };
  "billing:manage": { userId: string };
}
