import { publish } from "@/events/broker";
import { googleOauth2Client, imapClient, transporter } from "@/email/clients";
import { deleteEmailsByUserId, getEmailById } from "@/db/queries/emails";
import { deleteAccountByUserId, getAccountById } from "@/db/queries/accounts";
import { cancelEmailSync } from "@/email/cron/fetchNewEmails";
import { stopRefereshingTokens } from "@/email/cron/refreshTokens";
import { decrypt } from "@/utils/encryption";

export async function connect({ userId, platform }: { userId: string, platform: string }){
  if (platform === "gmail") {
    const scopes = [
      "https://mail.google.com/"
    ];
    const authUrl = googleOauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: scopes,
    prompt: "consent",
    state: userId
    });

    if (!authUrl) {
      throw new Error("Failed to generate auth url")
    }

    await publish("message:system", {
    id: userId,
    content: `[Authorize Gmail](${authUrl})`
    });
  }
}

export async function pruneEmails({ userId }: { userId: string }){
  const res = await deleteEmailsByUserId(userId);

  if (!res) {
    throw new Error(`Failed to delete emails for: ${userId}`);
  }

  await publish("message:system", {
   id: userId,
    content: "All emails have been removed from the system"
  });
}

export async function disconnect({ userId }: { userId: string }){
  const res = await deleteAccountByUserId(userId);

  if (!res) {
    throw new Error(`Failed to disconnect email for: ${userId}`);
  }

  await stopRefereshingTokens(res.id); 
  await cancelEmailSync(res.id);

  await publish("message:system", {
    id: userId,
    content: "Email logged out"
  });
}

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

export async function moveEmail({ emailId, folder, threadId }: { emailId: string, folder: string, threadId?: string }){
  const email = await getEmailById(emailId);
  if (!email) {
    throw new Error(`Failed to get email from db: ${emailId}`);
  }

  const account = await getAccountById(email.accountId);

  if (!account) {
    throw new Error(`Failed to get account from db: ${email.accountId}`);
  }

  const client = imapClient({
    host: "imap.gmail.com",
    accessToken: decrypt(account.accessToken),
    emailAddress: decrypt(account.providerAccountId),
  });
  await client.connect();

  const lock = await client.getMailboxLock('INBOX');
  try {
    const moved = await client.messageMove(email.externalEmailId, folder);

    if(!moved) {
      const boxes = await client.list()
      await publish("message:assistant", {
        id: email.userId,
        content: `Failed to move email to: ${folder}, Folder does not exist. \nHere are the existing folders:\n\n${boxes.map(item => item.name).join(' ')}`,
        emailId: email.id,
        threadId
      })
    } else {
        await publish("message:assistant", {
          id: email.userId,
          content: `Email has been moved to folder: ${folder}`,
          emailId: email.id,
          threadId
        });
    }
  } catch (err) {
    throw new Error(`Failed to move email: ${err}`)
  } finally {
    lock.release();
    await client.logout();
  }
}
