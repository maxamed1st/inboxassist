import { imapClient } from "@/email/clients";
import { simpleParser } from "mailparser";
import { insertEmail } from "@/db/queries/emails";
import { publish } from "@/events/broker";
import { getAccountByProviderAccountId } from "@/db/queries/accounts";

export async function fetchNewEmails(host: string, providerAccountId: string) {
  const account = await getAccountByProviderAccountId(providerAccountId);
  if (!account?.accessToken) {
    console.warn("No access token found for account", providerAccountId);
    return;
  }

  const client = imapClient({
    host,
    emailAddress: account.providerAccountId,
    accessToken: account.accessToken,
  });
  await client.connect();

  const lock = await client.getMailboxLock('INBOX');
  try {
    // Search for unseen emails since yesterday
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const uids = await client.search({ seen: false, since: yesterday });

    if (!uids) {
      return;
    }

    for await (const message of client.fetch(uids, { source: true })) {
      if (!message.source) {
        continue;
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
        userId: account.userId,
        accountId: account.id,
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
        date: parsed.date?.getTime() || Date.now(),
        status: "received" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const emailId = await insertEmail(values);

      if (!emailId) {
        console.error("Failed to insert email in db:", values.emailId);
        continue;
      }

      publish("email:new", { id: emailId.id } );
    }
  } catch (error) {
    console.error("Error fetching email:", error);
  } finally {
    lock.release();
    await client.logout();
  }
}
