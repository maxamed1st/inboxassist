import { getNewEmailsQueue, refreshTokensQueue } from "@/email/cron/queue";

export async function keepTokensFresh( provider: string,providerAccountId: string) {
  await refreshTokensQueue.add("refresh-tokens",
    { provider, providerAccountId },
    {
      jobId: `refresh-tokens:${providerAccountId}`,
      repeat: { every: 50 * 60 * 1000 },
      attempts: 3,
      backoff: { type: "exponential", delay: 60000 },
      removeOnComplete: true,
      removeOnFail: false,
    }
  );
}

export async function syncEmails(host: string, providerAccountId: string) {
  await getNewEmailsQueue.add("fetch-emails",
    { host, providerAccountId },
    {
      jobId: `fetch-emails:${providerAccountId}`,
      repeat: {
        every: 5 * 60 * 1000,
        immediately: true
      },
      attempts: 3,
      backoff: { type: "exponential" },
      removeOnComplete: true,
      removeOnFail: false,
    }
  );
}