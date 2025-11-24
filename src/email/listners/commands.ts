import { publish } from "@/events/broker";
import { googleOauth2Client, imapClient } from "@/email/clients";
import { deleteEmailsByUserId, getEmailById } from "@/db/queries/emails";
import { deleteAccountByUserId, getAccountByUserId } from "@/db/queries/accounts";
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

export async function toggleEmailReadStatus({userId, emailId, threadId }: { userId: string, emailId: string, threadId?: string }) {
  const email = await getEmailById(emailId);

  if(!email) {
    throw new Error(`Email not found ${emailId}`);
  }

  const account = await getAccountByUserId(userId);

  if(!account) {
    throw new Error(`User account could not be found ${userId}`)
  }

  const client = imapClient({
    host: "imap.gmail.com",
    emailAddress: decrypt(account.providerAccountId),
    accessToken: decrypt(account.accessToken),
  });

  await client.connect();

  try {
    const uid = await client.search({header: { "message-id": email.externalEmailId }});
    
    if(!uid || !uid[0]) {
      throw new Error(`Email not found in imap server: ${emailId}`);
    }

    const message = await client.fetchOne(uid[0], { source: false, envelope: false });

    if(!message) {
      throw new Error(`Could not fetch email from imap server: ${emailId}, ${uid}`);
    }

    const isSeen = message.flags?.has("//seen");

    if(isSeen) {
      await client.messageFlagsRemove(message.uid, ["\\seen"]);
      await publish("message:assistant", { 
        id: userId,
        content: "The email has been marked read",
        emailId,
        threadId
      });
    }
    else {
      await client.messageFlagsAdd(message.uid, ["\\seen"]);
      await publish("message:assistant", { 
        id: userId,
        content: "The email has been marked unread",
        emailId,
        threadId
      });
    }
  } catch(err) {
    throw new Error(`Failed to toggle seen flag: ${emailId}: ${err}`)
  }
}
