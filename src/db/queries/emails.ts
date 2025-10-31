import { db } from "@/db/client";
import { emailsTable } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function deleteEmailsByUserId(userId: string) {
  return db
    .delete()
    .from(emailsTable)
    where(eq(emailsTable.userId, userId)
    .then((rows) => rows[0]);
}

export async function getEmailById(providerAccountId: string) {
  return db
    .select()
    .from(emailsTable)
    .where(eq(emailsTable.Id, providerAccountId))
    .limit(1)
    .then((rows) => rows[0]);
  }
