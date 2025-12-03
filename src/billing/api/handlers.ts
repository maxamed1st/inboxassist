import type { Request, Response } from "express";
import { stripe } from "@/billing/client";
import type Stripe from "stripe";
import { insertSubscription, updateSubscriptionById } from "@/db/queries/billing";
import { getSubscriptionData } from "@/billing/utils/getSubscriptionData";
import { updateUserById } from "@/db/queries/user";
import { cancelEmailSync } from "@/email/cron/fetchNewEmails";
import { getAccountByUserId } from "@/db/queries/accounts";

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
    let updatedUser;

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
        updatedUser = await updateUserById(sub.userId, {
          subscriptionId: sub.id,
          subscriptionStatus: sub.status,
        });
        if (!updatedUser) {
          console.error("Failed to update user with subscription info:");
          return res.status(500).send("Internal Server Error");
        }
        break;

      case "customer.subscription.updated":
        values = getSubscriptionData(subscription);
        sub = await updateSubscriptionById(subscription.id, {
            ...values,
            updatedAt: new Date(),
        });
        if (!sub) {
          console.error("Failed to update subscription:");
          return res.status(500).send("Internal Server Error");
        }
        updatedUser = await updateUserById(sub.userId, {
          subscriptionId: sub.id,
          subscriptionStatus: sub.status,
        });
        if (!updatedUser) {
          console.error("Failed to update user with subscription info:");
          return res.status(500).send("Internal Server Error");
        }
        break;

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
        updatedUser = await updateUserById(sub.userId, {
          subscriptionId: sub.id,
          subscriptionStatus: sub.status,
        });
        if (!updatedUser) {
          console.error("Failed to update user with subscription info:");
          return res.status(500).send("Internal Server Error");
        }

        // remove email sync if it exists
        const account = await getAccountByUserId(sub.userId);
        if (!account) {
          console.error("Failed to find account for user:", sub.userId);
          return res.status(500).send("Internal Server Error");
        }
        await cancelEmailSync(account.id);
        break;
    }
}