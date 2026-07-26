import type { insertSubscription, updateSubscriptionById } from "@/db/queries/billing";
import type Stripe from "stripe";

type InsertValues = Parameters<typeof insertSubscription>[0];
type UpdateValues = Parameters<typeof updateSubscriptionById>[1];

export type UpdateSubParams =
  | {
      type: "insert";
      values: InsertValues;
      subscription: Stripe.Subscription;
    }
  | {
      type: "update" | "delete";
      values: UpdateValues;
      subscription: Stripe.Subscription;
    };
