import { Queue, Worker } from "bullmq";
import { publish } from "@/events/broker";
import { googleOauth2Client } from "@/email/clients";
import { getAccountById, updateAccountById } from "@/db/queries/accounts";
import { encrypt, decrypt} from "@/utils/encryption"
import { microsoftOauthClient } from "@/email/clients";
import { cancelEmailSync } from "./fetchNewEmails";
import { ctxError } from "@/utils/errorHandling";

// refresh access token when expired
async function refreshMicrosoftTokens(accountId: string) {
  const account = await getAccountById(accountId);
  if (!account) {
    throw ctxError("refreshMicrosoftTokens: account not found", { ctx: { accountId } });
  }

  // clear cache state
  microsoftOauthClient.getTokenCache().deserialize("");

  const userCache = decrypt(account.refreshToken);
  microsoftOauthClient.getTokenCache().deserialize(userCache)

  const userAccount = await microsoftOauthClient.getTokenCache().getAllAccounts();

  if(!userAccount[0]) {
    throw ctxError("refreshMicrosoftTokens: failed to get userAccount from cache", { ctx: { accountId } });
  }

  const tokens = await microsoftOauthClient.acquireTokenSilent({
    account: userAccount[0],
    scopes: [
        "https://outlook.office.com/IMAP.AccessAsUser.All",
        "https://outlook.office.com/SMTP.send",
        "offline_access",
      ],
  });

  const serializedCache = microsoftOauthClient.getTokenCache().serialize(); 

  const updatedAccount = await updateAccountById(accountId, {
    accessToken: encrypt(tokens.accessToken),
    refreshToken: encrypt(serializedCache),
    expiresAt: new Date(tokens.expiresOn!)
  });

  if(!updatedAccount) {
    throw ctxError("refreshMicrosoftTokens: failed to referesh tokens", { ctx: { accountId } });
  }
}

async function refreshGmailTokens(accountId: string) {
  const account = await getAccountById(accountId);
  if (!account) {
    throw ctxError("refreshGmailTokens: account not found", { ctx: { accountId } });
  }

  googleOauth2Client.setCredentials({ refresh_token: decrypt(account.refreshToken) });
  const { credentials } = await googleOauth2Client.refreshAccessToken();
  if (!credentials || !credentials.access_token || !credentials.refresh_token) {
    throw ctxError("refreshGmailTokens: Failed to refresh access token", { ctx: { accountId } });
  }

  const values = {
    accessToken: encrypt(credentials.access_token),
    refreshToken: encrypt(credentials.refresh_token),
    expiresAt: credentials.expiry_date ? new Date(credentials.expiry_date) : null,
    updatedAt: new Date(),
  };

  const updatedAccount = await updateAccountById(accountId, values);

  if (!updatedAccount) {
    throw ctxError("refreshGmailTokens: Failed to update tokens for", { ctx: { accountId } });
  }
}
const refreshTokensQueue = new Queue("refresh-account-tokens", { connection: { url: process.env.REDIS_URL! } });

new Worker("refresh-account-tokens", async (job) => {
    const { provider, accountId } = job.data;
    if (provider === "google" && accountId) {
      try {
        await refreshGmailTokens(accountId);
      } catch (error) {
        console.error(`Failed to refresh tokens for ${accountId}:`, error);
        const isLastAttempt = job.attemptsMade + 1 >= (job.opts.attempts ?? 1);
        if (isLastAttempt) {
          // reauthenticate user
          const account = await getAccountById(accountId);
          if(!account) throw ctxError("refreshTokensWorker: Failed to fetch account", { ctx: { accountId } });

          publish("email:connect", { userId: account.userId, platform: "gmail" });
          return;
        }
        throw error; // let the job be retried
      }
    }
    
    if (provider === "microsoft" && accountId) {
      try {
        await refreshMicrosoftTokens(accountId);
      } catch(error) {
        console.error(`Failed to refresh tokens for ${accountId}:`, error);
        const isLastAttempt = job.attemptsMade + 1 >= (job.opts.attempts ?? 1);
        if (isLastAttempt) {
          // reauthenticate user
          const account = await getAccountById(accountId);
          if(!account) throw ctxError("refreshTokensWorker: Failed to fetch account", { ctx: { accountId } });

          publish("message:system", { userId: account.userId, content: "You need to sync your email again"});
          publish("email:connect", { userId: account.userId, platform: "microsoft" });
          stopRefereshingTokens(accountId);
          cancelEmailSync(accountId);
          return;
        }
        throw error;
      }
    }
}, {
  connection: { url: process.env.REDIS_URL! },
});

export async function keepTokensFresh( provider: string, accountId: string) {
  await refreshTokensQueue.upsertJobScheduler(`refresh-tokens:${accountId}`,
    {
      every: 55 * 60 * 1000,
      startDate: new Date(Date.now() + 55 * 60 * 1000)
    },
    {
      name: "refresh-tokens",
      data: { provider, accountId },
      opts: {
      attempts: 3,
      backoff: { type: "exponential" },
      removeOnComplete: true,
      removeOnFail: false,
      },
    }
  );
}

export async function stopRefereshingTokens(accountId: string) {
  const removed = await refreshTokensQueue.removeJobScheduler(`refresh-tokens:${accountId}`);
  if (!removed) {
    console.warn(`QUEUE: Could not find scheduler for deletion: refresh-tokens:${accountId}`)
  }

  return removed;
}
