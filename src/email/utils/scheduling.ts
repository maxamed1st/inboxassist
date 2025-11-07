import { getNewEmailsQueue, refreshTokensQueue } from "@/email/cron/queue";

export async function keepTokensFresh(providerAccountId: string) {
  // refresh tokens periodically
  await refreshTokensQueue.add(`refresh-${providerAccountId}`,
    { provider: "google", providerAccountId },
    {
      repeat: { every: 50 * 60 * 1000 },
      attempts: 3,
      backoff: { type: "exponential", delay: 60000 },
      removeOnComplete: true,
      removeOnFail: false,
    }
  );

  //Fetch emails
  await getNewEmailsQueue.add(`fetch-${providerAccountId}`,
    { host: "imap.gmail.com", providerAccountId },
    {
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

export async function syncEmails(providerAccountId: string) {
  await getNewEmailsQueue.add(`fetch-${providerAccountId}`,
    { host: "imap.gmail.com", providerAccountId },
    {
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