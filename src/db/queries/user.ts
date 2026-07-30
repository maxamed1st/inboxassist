import { usersTable } from "../schema";
import { db } from '@/db/clients';
import { eq } from "drizzle-orm";

export async function insertUser(values: typeof usersTable.$inferInsert) {
  const [res] = await db
    .insert(usersTable)
    .values({
      ...values,
    })
    .returning();

  return res;
}

export async function getUserById(userId: string) {
  const [res] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);

  return res;
}

export async function updateUserById(userId: string, values: Partial<typeof usersTable.$inferInsert>) {
  const [res] = await db
    .update(usersTable)
    .set({
      ...values,
    })
    .where(eq(usersTable.id, userId))
    .returning();

  return res;
}
