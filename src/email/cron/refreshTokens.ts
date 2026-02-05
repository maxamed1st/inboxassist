import { Queue, Worker } from "bullmq";
import { publish } from "@/events/broker";
import { googleOauth2Client } from "@/email/clients";
import { getAccountById, updateAccountById } from "@/db/queries/accounts";
import { encrypt, decrypt} from "@/utils/encryption"
import { microsoftOauthClient } from "@/email/clients";

// refresh access token when expired
async function refreshMicrosoftTokens(accountId: string) {
  const account = await getAccountById(accountId);
  if (!account) {
    throw new Error("No account found for" + accountId);
  }

  const allAccounts = await microsoftOauthClient.getTokenCache().getAllAccounts();
  const userAccount = allAccounts.find(a => a.username == decrypt(account.providerAccountId));

  const tokens = await microsoftOauthClient.acquireTokenSilent({
    account: userAccount!,
    scopes: [
        "https://outlook.office.com/IMAP.AccessAsUser.All",
        "https://outlook.office.com/SMTP.send",
        "offline_access",
      ],
  });

  const updatedAccount = await updateAccountById(accountId, {
    accessToken: encrypt(tokens.accessToken),
    expiresAt: new Date(tokens.expiresOn!)
  });

  if(!updatedAccount) {
    throw new Error(`Failed to referesh tokens for: ${accountId}`);
  }
}

async function refreshGmailTokens(accountId: string) {
  const account = await getAccountById(accountId);
  if (!account) {
    throw new Error("No account found for" + accountId);
  }

  googleOauth2Client.setCredentials({ refresh_token: decrypt(account.refreshToken) });
  const { credentials } = await googleOauth2Client.refreshAccessToken();
  if (!credentials || !credentials.access_token || !credentials.refresh_token) {
    throw new Error("Failed to refresh access token");
  }

  const values = {
    accessToken: encrypt(credentials.access_token),
    refreshToken: encrypt(credentials.refresh_token),
    expiresAt: credentials.expiry_date ? new Date(credentials.expiry_date) : null,
    updatedAt: new Date(),
  };

  const updatedAccount = await updateAccountById(accountId, values);

  if (!updatedAccount) {
    throw new Error("Failed to update tokens for" + account.providerAccountId);
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
          publish("email:connect", { userId: account?.userId!, platform: "gmail" });
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
          publish("email:connect", { userId: account?.userId!, platform: "microsoft" });
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
      every: 50 * 60 * 1000,
      startDate: new Date(Date.now() + 50 * 60 * 1000)
    },
    {
      name: "refresh-tokens",
      data: { provider, accountId },
      opts: {
      attempts: 3,
      backoff: { type: "exponential", delay: 60000 },
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
