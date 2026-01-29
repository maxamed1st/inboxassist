import { getAccountByUserId } from "@/db/queries/accounts";
import { getEmailById, insertEmail, updateEmailById } from "@/db/queries/emails";
import { publish } from "@/events/broker";
import { decrypt, encrypt } from "@/utils/encryption";

export async function createDraft({ userId, content, inReplyToId, subject, threadId }: { userId: string, content: string, inReplyToId?: string, subject?: string, threadId?: string }) {
  if(!inReplyToId) {
    throw new Error("Composed reply missing inReplyToId");
  }

  const email = await getEmailById(inReplyToId);

  if(!email) {
    throw new Error(`Email associated with the draft doesn't exist in db: ${inReplyToId}`);
  }

  const account = await getAccountByUserId(userId);

  if(!account) {
    throw new Error(`Account doesnt exist for user ${userId}`);
  }

  // add sender to recipient list and remove reciever
  let toAddresses: string[];
  toAddresses = JSON.parse(decrypt(email.to));
  toAddresses = toAddresses.filter( e => e !== decrypt(account.providerAccountId));
  // extract email address
  const recipient = decrypt(email.from).match(/<([^>]+)>/)?.[1] as string;
  toAddresses.push(recipient);

  const values = {
    userId,
    accountId: account.id,
    externalEmailId: encrypt(crypto.randomUUID()),
    imapUid: 0,
    from: account.providerAccountId,
    to: encrypt(JSON.stringify(toAddresses)),
    cc: email.cc,
    inReplyTo: email.externalEmailId,
    references: [ ...email.references, email.externalEmailId ],
    subject: subject ? encrypt(subject) : email.subject,
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

  publish("message:assistant", { userId, emailId: draft.id, content: `${content} \n\n Send or edit?`, threadId })
}

export async function updateDraft({ userId, emailId, content, threadId }: { userId: string, emailId: string, content: string, threadId?: string }) {
  const updated = await updateEmailById(emailId, { content: { text: encrypt(content) } });

  if(!updated) {
    throw new Error(`Failed to update draft: ${emailId}`);
  }

  await publish("message:assistant", { userId, emailId, content: `${content} \n\n Send or edit further?`, threadId })
}
