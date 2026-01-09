import { stripe } from "@/billing/client";
import { getSubscriptionByUserId } from "@/db/queries/billing";
import { getUserById } from "@/db/queries/user";
import { publish } from "@/events/broker";

export async function checkout({ userId }: { userId: string }) {
  try {
    const user = await getUserById(userId);

    if(!user) throw new Error (`Failed to get user: ${userId}`)

    if (user.subscriptionStatus === "active") {
      await publish("message:system", {
        id: userId,
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

    if(!session.url) {
      throw new Error(`redirect url missing`)
    }

    await publish("message:system", {
      id: userId,
      content: `[checkout](${session.url})`
    });

  } catch (error) {
    console.error("Failed to create checkout session", error);
    throw error
  }
}

export async function customerPortal({ userId }: { userId: string }) {
  try {
    const subscription = await getSubscriptionByUserId(userId);

    if (!subscription) {
      throw new Error(`user doesn't exist: ${userId}`);
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.providerCustomerId,
      return_url: process.env.BOT_URL,
    });

    if(!session.url) {
      throw new Error(`redirect url missing`)
    }

    await publish("message:system", {
      id: userId,
      content: `[Manage Subscription](${session.url})`
    });

  } catch (error) {
    console.error("Failed to create customer portal", error);
    throw error
  }
}
