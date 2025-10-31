import { db } from "@/db/client";
import { accountsTable } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function deleteEmailsByUserId(userId: string) {
  return db
    .delete()
    .from(accountsTable)
    where(eq(accountsTable.userId, userId)
    .then((rows) => rows[0]);
}
