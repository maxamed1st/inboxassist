import type { Request, Response } from "express";
import { stripe } from "@/billing/client";
import type Stripe from "stripe";
import { insertSubscription, updateSubscriptionById } from "@/db/queries/billing";
import { getSubscriptionData } from "@/billing/utils/getSubscriptionData";

export async function stripeWebhook(req: Request, res: Response) {
  const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
  const stripeSignature = req.headers["stripe-signature"];

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      stripeSignature!,
      stripeWebhookSecret
    );
    } catch (err) {
      console.error("Error constructing Stripe event:", err);
      return res.status(400).send(`Webhook Error: Failed to construct event`);
    }

    const subscription = event.data.object as Stripe.Subscription;
    let values;
    let sub;

    switch (event.type) {
      case "customer.subscription.created":
        values = getSubscriptionData(subscription);
        sub = await insertSubscription({
            ...values,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        if (!sub) {
          console.error("Failed to insert subscription:");
          return res.status(500).send("Internal Server Error");
        }
        break;

      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        values = getSubscriptionData(subscription);
        sub = await updateSubscriptionById(subscription.id, {
            ...values,
            updatedAt: new Date(),
        });
        if (!sub) {
          console.error("Failed to update subscription:");
          return res.status(500).send("Internal Server Error");
        }
        break;
    }
}