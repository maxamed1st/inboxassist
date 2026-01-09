import type Stripe from "stripe";

export function getSubscriptionData(subscription: Stripe.Subscription) {
  const item = subscription.items.data[0]!

  return {
    userId: subscription.metadata.userId!,
    providerCustomerId: subscription.customer as string,
    providerSubscriptionId: subscription.id,
    plan: "standard",
    status: subscription.status,
    periodStart: new Date(item.current_period_start * 1000),
    periodEnd: new Date(item.current_period_end * 1000),
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
  }
}
