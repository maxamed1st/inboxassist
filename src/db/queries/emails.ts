import { db } from "@/db/client";
import { emailsTable } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function deleteEmailsByUserId(userId: string) {
  try {
    return db
      .delete(emailsTable)
      .where(eq(emailsTable.userId, userId))
  } catch(err) {
    console.error("Failed to delete emails:", err)
    return null;
  }
}

export async function getEmailById(emailId: string) {
  try {
    return db
      .select()
      .from(emailsTable)
      .where(eq(emailsTable.id, emailId))
      .limit(1)
      .then((rows) => rows[0]);
  } catch(err) {
    console.error("Failed to get Email", err)
    return null
  }
}

export async function insertEmail(emailData: typeof emailsTable.$inferInsert) {
  try {
    return db
      .insert(emailsTable)
      .values(emailData)
      .returning({ id: emailsTable.id });
  } catch(err) {
    console.error("Failed to insert Email", err)
    return null
  }
}