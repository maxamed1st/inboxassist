import { publish } from "@/events/broker";
import { transporter } from "@/email/clients";
import { getEmailById, updateEmailById } from "@/db/queries/emails";
import { getAccountById } from "@/db/queries/accounts";
import { decrypt } from "@/utils/encryption";

export async function sendEmail({ emailId, threadId }: { emailId: string, threadId?: string }){
  const email = await getEmailById(emailId);

  if(!email) {
    throw new Error(`Failed to fetch email: ${emailId}`);
  }

  if(email.status !== "draft") {
    console.error(`Email is not a draft: ${emailId}`);
    return;
  }

  const account = await getAccountById(email.accountId!)

  if(!account) {
    throw new Error(`Failed to get account for; ${email.userId}`);
  }
  const client = transporter({
      host: "smtp.office365.com",
      emailAddress : decrypt(email.from),
      accessToken : decrypt(account.accessToken),
  });

  const sent = await client.sendMail({
      from: decrypt(email.from),
      to: JSON.parse(decrypt(email.to)),
      subject: decrypt(email.subject),
      html: email.content.html ? decrypt(email.content.html) : "",
      text: email.content.text ? decrypt(email.content.text) : "",
  })

  // update external emailId and status
  const updatedEmail = await updateEmailById(emailId, {
    externalEmailId: sent.messageId,
    status: "sent",
    date: new Date(),
    updatedAt: new Date()
  })

  if(!updatedEmail) {
    console.error(`Could not update email from draft to sent: ${emailId}`);
    return;
  }

  await publish("message:assistant", {
      id: email.userId!,
      content: "Email sent to" + JSON.parse(decrypt(email.to)).slice(1, -1), // remove quotes
      emailId: updatedEmail.id,
      threadId
  });
}
