import { db } from "@/db/clients";
import { connectionsTable } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export async function insertConnection(values: typeof connectionsTable.$inferInsert) {
  const [res] = await db
    .insert(connectionsTable)
    .values({
      ...values,
    }
    )
    .returning();

  return res;
}

export async function getUserIdByTelegramId(telegramUserId: string) {
  const [res] = await db
    .select({ id: connectionsTable.userId })
    .from(connectionsTable)
    .where(eq(connectionsTable.platformAccountId, telegramUserId))
    .limit(1)

  return res;
}

export async function getTelegramUserId(internalUserId: string) {
  const [res] = await db
    .select({ id: connectionsTable.platformAccountId })
    .from(connectionsTable)
    .where(
      and(
        eq(connectionsTable.userId, internalUserId),
        eq(connectionsTable.platform, "telegram")
      ))
    .limit(1)

  return res;
}
