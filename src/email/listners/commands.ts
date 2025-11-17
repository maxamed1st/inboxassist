import { publish } from "@/events/broker";
import { googleOauth2Client } from "@/email/clients";
import { deleteEmailsByUserId } from "@/db/queries/emails";
import { deleteAccountByUserId } from "@/db/queries/accounts";
import { cancelEmailSync } from "@/email/cron/fetchNewEmails";
import { stopRefereshingTokens } from "@/email/cron/refreshTokens";

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
