import { db } from "@/db/client";
import { connectionsTable } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export async function insertConnection(values: typeof connectionsTable.$inferInsert) {
  try {
    return db
      .insert(connectionsTable)
      .values({
          ...values,
      }
      )
      .returning();
  } catch(err) {
    console.error("Failed to insert connection", err)
    return null
  }
}

export async function getUserIdByTelegramId(telegramUserId: string) {
  try {
    return db
      .select({id: connectionsTable.userId})
      .from(connectionsTable)
      .where(eq(connectionsTable.platformAccountId, telegramUserId))
      .limit(1)
      .then((rows) => rows[0]);
  } catch(err) {
    console.error("Failed to get userId by telegramId", err)
    return null
  }
}

export async function getTelegramUserId(internalUserId: string) {
  try {
    return db
      .select({id: connectionsTable.platformAccountId})
      .from(connectionsTable)
      .where(
        and(
          eq(connectionsTable.userId, internalUserId),
          eq(connectionsTable.platform, "telegram")
        ))
      .limit(1)
      .then((rows) => rows[0])
  } catch(err) {
    console.error("Failed to get telegram userId", err)
    return null
  };
}