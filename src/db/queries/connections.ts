import { db } from "@/db/client";
import { connectionsTable } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function insertConnection(values: typeof connectionsTable.$inferInsert) {
  return db
     .insert(connectionsTable)
     .values({
         ...values,
     }
     )
     .returning();
}

export async function getUserIdByTelegramId(telegramUserId: string) {
  return db
    .select({id: connectionsTable.id})
    .from(connectionsTable)
    .where(eq(connectionsTable.platformAccountId, telegramUserId))
    .limit(1)
    .then((rows) => rows[0]);
}