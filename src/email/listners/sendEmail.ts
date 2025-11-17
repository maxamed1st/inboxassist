import { publish } from "@/events/broker";
import { transporter } from "@/email/clients";
import { getEmailById } from "@/db/queries/emails";
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
      host: "smtp.gmail.com",
      emailAddress : decrypt(email.from),
      accessToken : decrypt(account.accessToken),
  });

  client.sendMail({
      from: decrypt(email.from),
      to: decrypt(email.to),
      subject: decrypt(email.subject),
      html: email.content.html ? decrypt(email.content.html) : "",
      text: email.content.text ? decrypt(email.content.text) : "",
  })

  await publish("message:system", {
      id: email.userId!,
      content: "Email sent to" + decrypt(email.to),
      threadId
  });
}
