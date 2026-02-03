import { db } from "@/db/clients";
import { subscriptionsTable } from "@/db/schema";
import { and, or, eq } from "drizzle-orm";

export async function insertSubscription(values: typeof subscriptionsTable.$inferInsert) {
  try{
    const [ res ] = await db
      .insert(subscriptionsTable)
      .values({
          ...values,
      })
      .returning();

    return res;
  } catch(err) {
    console.error("Failed to create subscription", err)
    return null
  }
}

export async function getSubscriptionByUserId(userId: string) {
  try{
    const [ res ] = await db
      .select()
      .from(subscriptionsTable)
      .where(eq(subscriptionsTable.userId, userId))
      .limit(1)

    return res;
  } catch(err) {
    console.error("Failed to get user", err)
    return null
  }
}

export async function getActiveSubscriptionByUserId(userId: string) {
  try{
    const [ res ] = await db
      .select()
      .from(subscriptionsTable)
      .where(
        and(
        eq(subscriptionsTable.userId, userId),
        or(
        eq(subscriptionsTable.status, 'active'),
        eq(subscriptionsTable.status, 'trialing')
        )))
      .limit(1)

    return res;
  } catch(err) {
    console.error("Failed to get user", err)
    return null
  }
}

export async function updateSubscriptionById(providerSubscriptionId: string, values: Partial<typeof subscriptionsTable.$inferInsert>) {
  try{
    const [ res ] = await db
      .update(subscriptionsTable)
      .set({
          ...values,
      }
      )
      .where(eq(subscriptionsTable.providerSubscriptionId, providerSubscriptionId))
      .returning();

    return res;
  } catch(err) {
    console.error("Failed to update subscription", err)
    return null
  }
}
