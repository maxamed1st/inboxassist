import { stripe } from "@/billing/clients";
import { getSubscriptionByUserId } from "@/db/queries/billing";
import { getUserById } from "@/db/queries/user";
import { publish } from "@/events/broker";
import { ctxError } from "@/utils/errorHandling";

export async function checkout({ userId }: { userId: string }) {
  const user = await getUserById(userId);

  if (!user) {
    throw ctxError("checkout: Failed to get user", { ctx: { userId } })
  }

  if (user.subscriptionStatus === "active") {
    await publish("message:system", {
      userId,
      content: `You already have a subscription. You can manage it with /manage_subscription.`
    });
    return;
  }

  const session = await stripe.checkout.sessions.create({
    line_items: [
      {
        price: process.env.STRIPE_PRICE_ID,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: process.env.BOT_URL,
    cancel_url: process.env.BOT_URL,
    subscription_data: {
      metadata: { userId },
    },
    automatic_tax: {
      enabled: true
    },
    tax_id_collection: {
      enabled: true
    }
  });

  if (!session.url) {
    throw ctxError("checkout: redirect url missing", { ctx: { userId } })
  }

  await publish("message:system", {
    userId: userId,
    content: `[checkout](${session.url})`
  });
}

export async function customerPortal({ userId }: { userId: string }) {
  const subscription = await getSubscriptionByUserId(userId);

  if (!subscription) {
    throw ctxError("customerPortal: user doesn't exist", { ctx: { userId } });
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: subscription.providerCustomerId,
    return_url: process.env.BOT_URL,
  });

  if (!session.url) {
    throw ctxError("customerPortal: redirect url missing", { ctx: { userId } })
  }

  await publish("message:system", {
    userId: userId,
    content: `[Manage Subscription](${session.url})`
  });
}
