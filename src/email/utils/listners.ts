import { publish } from "@/events/broker";
import { googleOauth2Client, imapClient, transporter } from "@/email/clients";
import { deleteEmailsByUserId, getEmailById } from "@/db/queries/emails";
import { deleteAccountByUserId, getAccountById } from "@/db/queries/accounts";

export async function login({ userId, platform }: { userId: string, platform: string }){
  if (platform === "gmail") {
    const scopes = ["https://mail.google.com/"];
    const authUrl = googleOauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: scopes,
    state: userId
    });

    await publish("message:system", {
    id: userId,
    content: `To connect your Gmail account, please click the following link:\n${authUrl}`
    });
  }
}

export async function pruneEmails({ userId }: { userId: string }){
  const res = await deleteEmailsByUserId(userId);

  if (!res) {
    console.error("Failed to delete emails for", userId);
    return;
  }

  await publish("message:system", {
   id: userId,
    content: "All emails have been removed from the system"
  });
}

export async function logout({ userId }: { userId: string }){
  const res = await deleteAccountByUserId(userId);

  if (!res) {
    console.error("Failed to logout email for", userId);
    return;
  }

  await publish("message:system", {
    id: userId,
    content: "Email logged out"
  });
}

export async function sendEmail({ emailId }: { emailId: string }){
  const email = await getEmailById(emailId);

  if(!email) {
    console.error("Failed to fetch email", emailId);
    return;
  }

  const account = await getAccountById(email.accountId!)

  if(!account) {
    console.error("Failed to get account for", email.userId);
    return;
  }
  const client = transporter({
      host: "smtp.gmail.com",
      emailAddress : email.from,
      accessToken : account.accessToken,
  });

  client.sendMail({
      from: email.from,
      to: email.to,
      subject: email.subject,
      html: email.content.html ?? "",
      text: email.content.text ?? "",
  })

  await publish("message:system", {
      id: email.userId!,
      content: "Email sent to" + email.to
  });
}

export async function moveEmail({ emailId, folder }: { emailId: string, folder: string }){
  const email = await getEmailById(emailId);
  if (!email) {
    console.warn("Failed to get email from db:", emailId);
    return;
  }

  const account = await getAccountById(email.accountId);

  if (!account) {
    console.warn("Failed to get account from db:", email.accountId);
    return;
  }

  const client = imapClient({
    host: "imap.gmail.com",
    accessToken: account.accessToken,
    emailAddress: account.providerAccountId,
  });
  await client.connect();

  const lock = await client.getMailboxLock('INBOX');
  try {
    await client.messageMove(email.emailId, folder);
  } finally {
    lock.release();
    await client.logout();
  }

  await publish("message:system", {
    id: email.userId,
    content: `Email has been moved to folder: ${folder}`
  });
}