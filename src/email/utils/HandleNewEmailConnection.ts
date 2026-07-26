import { getAccountByUserId, insertAccount, updateAccountById } from "@/db/queries/accounts";
import { syncEmails } from "@/email/cron/fetchNewEmails";
import { encrypt } from "@/utils/encryption";
import { getUserById, updateUserById } from "@/db/queries/user";
import { keepTokensFresh } from "@/email/cron/refreshTokens";
import { PersistEmailAccountProps } from "../types";

export async function HandleNewEmailConnection({
  userId, provider, providerAccountId, displayName, imapHost, smtpHost, accessToken, refreshToken, expiresAt
}: PersistEmailAccountProps) {
  // prepare values for DB insert
  const now = new Date();
  const values = {
    userId,
    provider: provider,
    providerAccountId: encrypt(providerAccountId),
    providerIMAP: encrypt(imapHost),
    providerSMTP: encrypt(smtpHost),
    accessToken: encrypt(accessToken),
    refreshToken: encrypt(refreshToken),
    expiresAt: expiresAt ? new Date(expiresAt) : null,
    updatedAt: now,
  };

  // Check if user has account
  let account;
  const existingAccount = await getAccountByUserId(userId)

  // insert into accounts table
  if (existingAccount) {
    account = await updateAccountById(existingAccount.id, values);
  } else {
    account = await insertAccount({
      ...values,
      createdAt: now
    });
  }

  if (!account) {
    throw new Error("persistEmailAccount: Failed to insert account")
  }

  // sync emails if user has active subscription
  const user = await getUserById(userId);

  if (!user) {
    throw new Error("persistEmailAccount: Failed to get user")
  }

  if (user.subscriptionStatus === "active" || user.subscriptionStatus === "trialing") {
    await syncEmails(account.id);
    await keepTokensFresh(provider, account.id);
  }

  // update user info
  const updatedUser = await updateUserById(userId, {
    name: encrypt(displayName),
    email: encrypt(providerAccountId)
  })

  if (!updatedUser) {
    throw new Error(`persistEmailAccount: Failed to update user table: ${userId}`)
  }

  return true;
}
