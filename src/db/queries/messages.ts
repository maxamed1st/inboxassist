import { and, eq, or, sql } from "drizzle-orm";
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

export async function getMessageById(messageId: string) {
  try{
    const [ res ] = await db
      .select()
      .from(messagesTable)
      .where(eq(messagesTable.id, messageId))
      .limit(1)

    return res;
  } catch(err) {
    console.error("Failed to get message by id", err)
    return null
  }
}

export async function getPreviouseMessages(threadId: string) {
  try{
    const res = await db
      .select({ content: messagesTable.content, role: messagesTable.role })
      .from(messagesTable)
      .where(
        or(
          eq(messagesTable.id, threadId),
          sql`${messagesTable.references}->>0 = ${threadId}`
        ));

    return res;
  } catch(err) {
    console.error("Failed to get message by id", err)
    return null
  }
}