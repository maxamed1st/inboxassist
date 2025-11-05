import { db } from "@/db/client";
import { accountsTable } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function insertAccount(values: typeof accountsTable.$inferInsert) {
  try{
    return db
      .insert(accountsTable)
      .values({
          ...values,
      }
      )
      .returning();
  } catch(err) {
    console.error("Failed to insert account", err)
    return null
  }
}

export async function updateAccount(providerAccountId: string, values: Partial<typeof accountsTable.$inferInsert>) {
  try{
    return db
      .update(accountsTable)
      .set({
          ...values,
      }
      )
      .where(eq(accountsTable.providerAccountId, providerAccountId))
      .returning();
  } catch(err) {
    console.error("Failed to update account", err)
    return null
  }
}

export async function getAccountById(accountId: string) {
  try{
    return db
      .select()
      .from(accountsTable)
      .where(eq(accountsTable.id, accountId))
      .limit(1)
      .then((rows) => rows[0]);
  } catch(err) {
    console.error("Failed to get account", err)
    return null
  }
}

export async function getAccountByProviderAccountId(providerAccountId: string) {
  try{
    return db
      .select()
      .from(accountsTable)
      .where(eq(accountsTable.providerAccountId, providerAccountId))
      .limit(1)
      .then((rows) => rows[0]);
  } catch(err) {
    console.error("Failed account by providerAccountId", err)
    return null
  }
}

export async function deleteAccountByUserId(userId: string) {
  try{
    return db
      .delete(accountsTable)
      .where(eq(accountsTable.userId, userId))
  } catch(err) {
    console.error("Failed to delete account", err)
    return null
  }
}
