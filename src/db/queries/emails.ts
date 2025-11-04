import { db } from "@/db/client";
import { emailsTable } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function deleteEmailsByUserId(userId: string) {
  return db
    .delete(emailsTable)
    .where(eq(emailsTable.userId, userId))
}

export async function getEmailById(emailId: string) {
  return db
    .select()
    .from(emailsTable)
    .where(eq(emailsTable.id, emailId))
    .limit(1)
    .then((rows) => rows[0]);
  }

export async function insertEmail(emailData: typeof emailsTable.$inferInsert) {
  return db
    .insert(emailsTable)
    .values(emailData)
    .returning({ id: emailsTable.id });
}