import { db } from "@/db/client";
import { subscriptionsTable } from "@/db/schema";
import { eq } from "drizzle-orm";

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

export async function updateSubscriptionById(subscriptionId: string, values: Partial<typeof subscriptionsTable.$inferInsert>) {
  try{
    const [ res ] = await db
      .update(subscriptionsTable)
      .set({
          ...values,
      }
      )
      .where(eq(subscriptionsTable.id, subscriptionId))
      .returning();

    return res;
  } catch(err) {
    console.error("Failed to update subscription", err)
    return null
  }
}