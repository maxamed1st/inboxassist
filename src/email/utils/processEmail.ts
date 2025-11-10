import { simpleParser } from "mailparser";
import { getEmailByExtrernalEmailId, insertEmail } from "@/db/queries/emails";
import { publish } from "@/events/broker";
import { FetchMessageObject } from "imapflow";
import { encrypt } from "@/utils/encryption";


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
    externalEmailId: parsed.messageId || crypto.randomUUID(),
    from: parsed.from ? encrypt(parsed.from.text) : "unknown",
    to: encrypt(JSON.stringify(formatAddresses((parsed.to as any)?.value))),
    cc: encrypt(JSON.stringify(formatAddresses((parsed.cc as any)?.value))),
    bcc: encrypt(JSON.stringify(formatAddresses((parsed.bcc as any)?.value))),
    inReplyTo: parsed.inReplyTo,
    references: normalizeReferences(parsed.references),
    subject: parsed.subject ? encrypt(parsed.subject) : "",
    content: { 
      text: parsed.text ? encrypt(parsed.text) : undefined, 
      html: parsed.html ? encrypt(parsed.html) : undefined 
    },
    date: parsed.date || new Date(),
    status: "received" as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const existingEmail = await getEmailByExtrernalEmailId(values.externalEmailId);

  if(existingEmail) {
    console.warn("Email already fetched");
    return;
  }

  const emailId = await insertEmail(values);

  if (!emailId) {
    console.error("Failed to insert email in db:", values.externalEmailId);
    return;
  }

  publish("email:new", { id: emailId.id } );
}