import { insertSubscription, updateSubscriptionById } from "@/db/queries/billing";
import { updateUserById } from "@/db/queries/user";
import { cancelEmailSync } from "@/email/cron/fetchNewEmails";
import { getAccountByUserId } from "@/db/queries/accounts";
import { UpdateSubParams } from "../types";


export async function updateSub({ type, values, subscription }: UpdateSubParams) {
  let sub;

  if (type == "insert") {
    sub = await insertSubscription({
      ...values,
    });
  } else {
    sub = await updateSubscriptionById(subscription.id, {
      ...values,
    });
  }

  if (!sub) {
    console.error("updateSub: Failed to update subscription:");
    return false;
  }

  const updatedUser = await updateUserById(sub.userId, {
    subscriptionId: sub.id,
    subscriptionStatus: sub.status,
  });

  if (!updatedUser) {
    console.error("updateSub: Failed to update user with subscription info:");
    return false;
  }

  // remove email sync if deleted subscription
  if (type == "delete") {
    const account = await getAccountByUserId(sub.userId);
    if (!account) {
      console.error("updateSub: Failed to find account for user:", sub.userId);
      return false;
    }
    await cancelEmailSync(account.id);
  }

  return true;
}
