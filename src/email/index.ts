import { publish, subscribe } from "@/events/broker";
import { googleOauth2Client } from "@/email/clients";
import { deleteEmailsByUserId } from "@db/queries/emails";
import { deleteAccountByUserId } from "@db/queries/accounts";

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
  await subscribe("email:prune", "email", async (userId) => {
    await deleteEmailsByUserId(user);

    publish("message:system", {
      id: userId,
      content: "All emails have been removed from the system"
    }
  }
}
