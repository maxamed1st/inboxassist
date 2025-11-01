import { publish, subscribe } from "@/events/broker";
import { googleOauth2Client, gmailTransporter } from "@/email/clients";
import { deleteEmailsByUserId, getEmailById } from "@/db/queries/emails";
import { deleteAccountByUserId, getAccountById } from "@/db/queries/accounts";

export default async function main() {
  await subscribe("email:login", "email", async ({userId, platform}) => {
    /* generate OAuth URL and send to user */
    if (platform === "gmail") {
      const scopes = ["https://mail.google.com/"];
      const authUrl = googleOauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: scopes,
      state: userId
      });

      publish("message:system", {
        id: userId,
        content: `To connect your Gmail account, please click the following link:\n${authUrl}`
      });
    }
  });

  //delete emails
  await subscribe("email:prune", "email", async ({ userId }) => {
    await deleteEmailsByUserId(userId);

    publish("message:system", {
      id: userId,
      content: "All emails have been removed from the system"
    });
  });

  // Log user out
  await subscribe("email:logout", "email", async ({ userId }) => {
    await deleteAccountByUserId(userId);

    publish("message:system", {
      id: userId,
      content: "Email logged out"
    });
  });

  // Send email
  await subscribe("action:send", "email", async ({ emailId }) => {
    const email = await getEmailById(emailId);
    const account = await getAccountById(email?.accountId!)
    const transporter = gmailTransporter({
    emailAddress : email?.from!,
    refreshToken : account?.refreshToken!
    });

    transporter.sendMail({
      from: email?.from,
      to: email?.to,
      subject: email?.subject,
      html: email?.content.html ?? "",
      text: email?.content.text ?? "",
    })

    publish("message:system", {
      id: email?.userId!,
      content: "Email sent to" + email?.to
    });
  });
}
