import { db } from "@/db/client.js";
import { accountsTable } from "@/db/schema.js";

export async function insertAccount(values: typeof accountsTable.$inferInsert) {
  return db
    .insert(accountsTable)
    .values({
        ...values,
    }
    )
    .returning();
}