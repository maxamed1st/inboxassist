import Stripe from "stripe";
import { getSubscriptionByUserId } from "@/db/queries/billing";
import { publish } from "@/events/broker";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function checkout({ userId }: { userId: string }) {
  try {
    const subscription = await getSubscriptionByUserId(userId);
    const trialdays = subscription ? undefined : 7;

    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: process.env.STRIPE_SUCCESS_CALLBACK,
      cancel_url: process.env.STRIPE_CANCEL_CALLBACK,
      subscription_data: {
        trial_period_days: trialdays
      },
      automatic_tax: {
        enabled: true
      },
      tax_id_collection: {
        enabled: true
      },
      customer_update: {
        address: "auto",
        name: "auto"
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
