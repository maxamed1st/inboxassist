import { db } from "@/db/client";
import { accountsTable } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function insertAccount(values: typeof accountsTable.$inferInsert) {
  return db
    .insert(accountsTable)
    .values({
        ...values,
    }
    )
    .returning();
  }

export async function updateAccount(providerAccountId: string, values: Partial<typeof accountsTable.$inferInsert>) {
  return db
    .update(accountsTable)
    .set({
        ...values,
    }
    )
    .where(eq(accountsTable.providerAccountId, providerAccountId))
    .returning();
  }

export async function getAccountByProviderAccountId(providerAccountId: string) {
  return db
    .select()
    .from(accountsTable)
    .where(eq(accountsTable.providerAccountId, providerAccountId))
    .limit(1)
    .then((rows) => rows[0]);
  }

export async function deleteAccountByUserId(userId: string) {
  return db
    .delete()
    .from(accountsTable)
    where(eq(accountsTable.userId, userId)
    .then((rows) => rows[0]);
}
