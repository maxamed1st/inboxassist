import { db } from "@/db/client";
import { accountsTable } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function insertAccount(values: typeof accountsTable.$inferInsert) {
  try{
    const [ res ] = await db
      .insert(accountsTable)
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

export async function updateAccountById(accountId: string, values: Partial<typeof accountsTable.$inferInsert>) {
  try{
    const [ res ] = await db
      .update(accountsTable)
      .set({
          ...values,
      }
      )
      .where(eq(accountsTable.id, accountId))
      .returning();

    return res;
  } catch(err) {
    console.error("Failed to update account", err)
    return null
  }
}

export async function getAccountById(accountId: string) {
  try{
    const [ res ] = await db
      .select()
      .from(accountsTable)
      .where(eq(accountsTable.id, accountId))
      .limit(1)

    return res;
  } catch(err) {
    console.error("Failed to get account", err)
    return null
  }
}

export async function getAccountByUserId(userId: string) {
  try{
    const [ res ] = await db
      .select()
      .from(accountsTable)
      .where(eq(accountsTable.userId, userId))
      .limit(1)

    return res;
  } catch(err) {
    console.error("Failed to get account", err)
    return null
  }
}

export async function deleteAccountByUserId(userId: string) {
  try{
    const [ res ] = await db
      .delete(accountsTable)
      .where(eq(accountsTable.userId, userId))
      .returning({id: accountsTable.id, provider: accountsTable.provider})

    return res;
  } catch(err) {
    console.error("Failed to delete account", err)
    return null
  }
}
