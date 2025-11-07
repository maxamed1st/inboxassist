import { simpleParser } from "mailparser";
import { insertEmail } from "@/db/queries/emails";
import { publish } from "@/events/broker";
import { FetchMessageObject } from "imapflow";


export async function processEmail(message: FetchMessageObject, userId: string, accountId: string) {
  if (!message.source) {
    return;
  }
  
  const parsed = await simpleParser(message.source);

  // Helper to normalize addresses
  function formatAddresses(addresses: any) {
    if (!addresses) return [];
    const addressArray = Array.isArray(addresses) ? addresses : [addresses];
    return addressArray
      .map(addr => addr.address || addr)
      .filter(Boolean);
  }

  // Helper to normalize references
  function normalizeReferences(refs: string | string[] | undefined): string[] {
    if (!refs) return [];
    return Array.isArray(refs) ? refs : [refs];
  }

  const values = {
    userId: userId,
    accountId: accountId,
    emailId: parsed.messageId || crypto.randomUUID(),
    from: parsed.from?.text || "unknown",
    to: formatAddresses((parsed.to as any)?.value),
    cc: formatAddresses((parsed.cc as any)?.value),
    bcc: formatAddresses((parsed.bcc as any)?.value),
    inReplyTo: parsed.inReplyTo,
    references: normalizeReferences(parsed.references),
    subject: parsed.subject || "",
    content: { 
      text: parsed.text, 
      html: parsed.html || undefined 
    },
    date: parsed.date || new Date(),
    status: "received" as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const emailId = await insertEmail(values);

  if (!emailId) {
    console.error("Failed to insert email in db:", values.emailId);
    return;
  }

  publish("email:new", { id: emailId.id } );
}