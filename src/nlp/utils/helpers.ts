import { getEmailById } from "@/db/queries/emails";
import { decrypt } from "@/utils/encryption";

export async function getEmailContent(id: string ) {
  const email = await getEmailById(id);

  if (!email) {
    throw new Error(`Failed to fetch email to summerize:${id}`)
  }

  const userId = email.userId;
  const from = decrypt(email.from);
  const subject = decrypt(email.subject);
  
  let content;

  if(email.content.text) {
    content = decrypt(email.content.text);
  } else if (email.content.html) {
    content = decrypt(email.content.html)
  }

  return { userId, from, subject, content };
}