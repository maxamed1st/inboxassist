import type { Request, Response } from "express";
import { stripe } from "@/billing/clients";
import type Stripe from "stripe";
import { getSubscriptionData } from "@/billing/utils/getSubscriptionData";
import { updateSub } from "../utils/updateSubscription";

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

  switch (event.type) {
    case "customer.subscription.created": {
      const values = getSubscriptionData(subscription);

      const subUpdated = await updateSub({
        type: "insert",
        values: { ...values, createdAt: new Date(), updatedAt: new Date() },
        subscription,
      });

      if (!subUpdated) {
        return res.status(500).send("Internal Server Error");
      }

      break;
    }

    case "customer.subscription.updated": {
      const values = getSubscriptionData(subscription);

      const subUpdated = await updateSub({
        type: "update",
        values: { ...values, updateAt: new Date() },
        subscription
      })

      if (!subUpdated) {
        return res.status(500).send("Internal Server Error");
      }

      break;
    }

    case "customer.subscription.deleted": {
      const values = getSubscriptionData(subscription);

      const subUpdated = await updateSub({
        type: "delete",
        values: { ...values, updatedAt: new Date() },
        subscription,
      })

      if (!subUpdated) {
        return res.status(500).send("Internal Server Error");
      }

      break;
    }
  }
}
