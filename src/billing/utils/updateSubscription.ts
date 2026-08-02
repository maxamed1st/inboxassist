import { insertSubscription, updateSubscriptionById } from "@/db/queries/billing";
import { updateUserById } from "@/db/queries/user";
import { cancelEmailSync } from "@/email/cron/fetchNewEmails";
import { getAccountByUserId } from "@/db/queries/accounts";
import { UpdateSubParams } from "../types";
import { ctxError } from "@/utils/errorHandling";


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
    throw ctxError("updateSub: Failed to update sub", {
      ctx: { subscriptionId: subscription.id }
    });
  }

  const updatedUser = await updateUserById(sub.userId, {
    subscriptionId: sub.id,
    subscriptionStatus: sub.status,
  });

  if (!updatedUser) {
    throw ctxError("updateSub: Failed to update user with subscription info", {
      ctx: { userId: sub.userId, subscriptionId: subscription.id }
    });
  }

  // remove email sync if deleted subscription
  if (type == "delete") {
    const account = await getAccountByUserId(sub.userId);
    if (!account) {
      throw ctxError("updateSub: Failed to find account for user", {
        ctx: { userId: sub.userId }
      });
    }

    await cancelEmailSync(account.id);
  }
}
