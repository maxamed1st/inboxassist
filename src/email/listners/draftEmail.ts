import { getAccountByUserId } from "@/db/queries/accounts";
import { getEmailById, insertEmail } from "@/db/queries/emails";
import { publish } from "@/events/broker";
import { decrypt, encrypt } from "@/utils/encryption";

export async function createDraft({ id, content, inReplyToId, threadId }: { id: string, content: string, to?: string, inReplyToId?: string, threadId?: string }) {
  if(!inReplyToId) {
    throw new Error("Composed reply missing inReplyToId");
  }

  const email = await getEmailById(inReplyToId);

  if(!email) {
    throw new Error(`Email associated with the draft doesn't exist in db: ${inReplyToId}`);
  }

  const account = await getAccountByUserId(id);

  if(!account) {
    throw new Error(`Account doesnt exist for user ${id}`);
  }

  // add sender to recipient list and remove reciever
  let toAddresses: string[];
  toAddresses = JSON.parse(decrypt(email.to));
  toAddresses = toAddresses.filter( e => e !== decrypt(account.providerAccountId));
  // extract email address
  const recipient = decrypt(email.from).match(/<([^>]+)>/)?.[1] as string;
  toAddresses.push(recipient);

  const values = {
    userId: id,
    accountId: account.id,
    externalEmailId: encrypt(crypto.randomUUID()),
    imapUid: 0,
    from: account.providerAccountId,
    to: encrypt(JSON.stringify(toAddresses)),
    cc: email.cc,
    inReplyTo: email.externalEmailId,
    references: [ ...email.references, email.externalEmailId ],
    subject: email.subject,
    content: { text: encrypt(content) },
    date: new Date(),
    status: "draft" as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const draft = await insertEmail(values);

  if(!draft) {
    throw new Error(`Could not insert draft`);
  }

  publish("message:assistant", { id, emailId: draft.id, content, threadId })
}
