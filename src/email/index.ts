import { publish, subscribe } from "@/events/broker";
import { googleOauth2Client, imapClient, transporter } from "@/email/clients";
import { deleteEmailsByUserId, getEmailById } from "@/db/queries/emails";
import { deleteAccountByUserId, getAccountById } from "@/db/queries/accounts";

export default async function main() {
  subscribe("email:login", "email", async ({userId, platform}) => {
    /* generate OAuth URL and send to user */
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
  });

  //delete emails
  subscribe("email:prune", "email", async ({ userId }) => {
    await deleteEmailsByUserId(userId);

    await publish("message:system", {
      id: userId,
      content: "All emails have been removed from the system"
    });
  });

  // Log user out
  subscribe("email:logout", "email", async ({ userId }) => {
    await deleteAccountByUserId(userId);

    await publish("message:system", {
      id: userId,
      content: "Email logged out"
    });
  });

  // Send email
  subscribe("action:send", "email", async ({ emailId }) => {
    const email = await getEmailById(emailId);
    const account = await getAccountById(email?.accountId!)
    const client = transporter({
      host: "smtp.gmail.com",
      emailAddress : email?.from!,
      accessToken : account?.accessToken!,
    });

    client.sendMail({
      from: email?.from,
      to: email?.to,
      subject: email?.subject,
      html: email?.content.html ?? "",
      text: email?.content.text ?? "",
    })

    await publish("message:system", {
      id: email?.userId!,
      content: "Email sent to" + email?.to
    });
  });

  // move email
  subscribe("action:move", "email", async ({ emailId, folder }) => {
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
  });
}
