import { db } from "@/db/clients";
import { accountsTable } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function insertAccount(values: typeof accountsTable.$inferInsert) {
  const [res] = await db
    .insert(accountsTable)
    .values({
      ...values,
    }
    )
    .returning();

  return res;
}

export async function updateAccountById(accountId: string, values: Partial<typeof accountsTable.$inferInsert>) {
  const [res] = await db
    .update(accountsTable)
    .set({
      ...values,
    }
    )
    .where(eq(accountsTable.id, accountId))
    .returning();

  return res;
}

export async function getAccountById(accountId: string) {
  const [res] = await db
    .select()
    .from(accountsTable)
    .where(eq(accountsTable.id, accountId))
    .limit(1)

  return res;
}

export async function getAccountByUserId(userId: string) {
  const [res] = await db
    .select()
    .from(accountsTable)
    .where(eq(accountsTable.userId, userId))
    .limit(1)

  return res;
}

export async function deleteAccountByUserId(userId: string) {
  const [res] = await db
    .delete(accountsTable)
    .where(eq(accountsTable.userId, userId))
    .returning({ id: accountsTable.id, provider: accountsTable.provider })

  return res;
}
