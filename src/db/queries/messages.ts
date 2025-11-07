import { and, eq } from "drizzle-orm";
import { db } from "../client";
import { messagesTable } from "../schema";

export async function insertMessage(values: typeof messagesTable.$inferInsert) {
  try{
    const [ res ] = await db
      .insert(messagesTable)
      .values({
          ...values,
      }
      )
      .returning();

    return res;
  } catch(err) {
    console.error("Failed to insert account", err)
    return null
  }
}

export async function getMessageByPlatformMessageId(userId: string, platformMessageId: string) {
  try{
    const [ res ] = await db
      .select()
      .from(messagesTable)
      .where(
        and(
          eq(messagesTable.userId, userId),
          eq(messagesTable.platformMessageId, platformMessageId)
      ))
      .limit(1)

    return res;
  } catch(err) {
    console.error("Failed to get account", err)
    return null
  }
}
