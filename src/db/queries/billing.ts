import { db } from "@/db/clients";
import { subscriptionsTable } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function insertSubscription(values: typeof subscriptionsTable.$inferInsert) {
  const [res] = await db
    .insert(subscriptionsTable)
    .values({
      ...values,
    })
    .returning();

  return res;
}

export async function getSubscriptionByUserId(userId: string) {
  const [res] = await db
    .select()
    .from(subscriptionsTable)
    .where(eq(subscriptionsTable.userId, userId))
    .limit(1)

  return res;
}

export async function updateSubscriptionById(providerSubscriptionId: string, values: Partial<typeof subscriptionsTable.$inferInsert>) {
  const [res] = await db
    .update(subscriptionsTable)
    .set({
      ...values,
    }
    )
    .where(eq(subscriptionsTable.providerSubscriptionId, providerSubscriptionId))
    .returning();

  return res;
}
