import { getEmailById, updateEmailById } from "@/db/queries/emails";
import { decrypt, encrypt } from "@/utils/encryption";
import { ctxError } from "@/utils/errorHandling";

export async function getEmailContent(id: string ) {
  const email = await getEmailById(id);

  if (!email) {
    throw ctxError("Failed to fetch email to summerize", { ctx: { id } })
  }

  const userId = email.userId;
  const emailId = email.id;
  const from = decrypt(email.from);
  const subject = decrypt(email.subject);
  
  let content;

  if(email.content.text) {
    content = decrypt(email.content.text);
  } else if (email.content.html) {
    content = decrypt(email.content.html)
  }

  return { userId, emailId, from, subject, content };
}

export async function storeSummary( emailId: string, summary: string ) {
  const email = await getEmailById(emailId);
  if (!email) {
    console.error("failed to fetch summerised email from db", emailId);
    return null;
  }
  const content = email.content
  content.summary = encrypt(summary);

  const updatedEmail = await updateEmailById(emailId, { content })

  if (!updatedEmail) {
    console.error("Failed to insert summary", emailId);
    return null;
  }

  return updatedEmail;
}
