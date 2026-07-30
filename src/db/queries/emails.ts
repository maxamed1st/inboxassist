import { db } from "@/db/clients";
import { emailsTable } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function deleteEmailsByUserId(userId: string) {
  const res = await db
    .delete(emailsTable)
    .where(eq(emailsTable.userId, userId))

  return res;
}

export async function getEmailById(emailId: string) {
  const [res] = await db
    .select()
    .from(emailsTable)
    .where(eq(emailsTable.id, emailId))
    .limit(1)

  return res;
}

export async function getEmailByExtrernalEmailId(externalEmailId: string) {
  const [res] = await db
    .select()
    .from(emailsTable)
    .where(eq(emailsTable.externalEmailId, externalEmailId))
    .limit(1)

  return res;
}

export async function insertEmail(emailData: typeof emailsTable.$inferInsert) {
  const [res] = await db
    .insert(emailsTable)
    .values(emailData)
    .returning();

  return res;
}

export async function updateEmailById(emailId: string, values: Partial<typeof emailsTable.$inferInsert>) {
  const [res] = await db
    .update(emailsTable)
    .set({
      ...values,
    }
    )
    .where(eq(emailsTable.id, emailId))
    .returning();

  return res;
}
