import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db/clients";
import { messagesTable } from "../schema";

export async function insertMessage(values: typeof messagesTable.$inferInsert) {
  const [res] = await db
    .insert(messagesTable)
    .values({
      ...values,
    }
    )
    .returning();

  return res;
}

export async function getMessageByPlatformMessageId(userId: string, platformMessageId: string) {
  const [res] = await db
    .select()
    .from(messagesTable)
    .where(
      and(
        eq(messagesTable.userId, userId),
        eq(messagesTable.platformMessageId, platformMessageId)
      ))
    .limit(1)

  return res;
}

export async function getMessageById(messageId: string) {
  const [res] = await db
    .select()
    .from(messagesTable)
    .where(eq(messagesTable.id, messageId))
    .limit(1)

  return res;
}

export async function getRecentMessages(userId: string, limit: number = 20) {
  const res = await db
    .select({
      content: messagesTable.content,
      role: messagesTable.role,
      emailId: messagesTable.emailId,
      replyToId: messagesTable.replyToId
    })
    .from(messagesTable)
    .where(eq(messagesTable.userId, userId))
    .orderBy(desc(messagesTable.createdAt))
    .limit(limit)

  return res?.reverse();
}
