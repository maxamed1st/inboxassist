import { usersTable } from "../schema";
import { db } from "../client";
import { eq } from "drizzle-orm";

export async function insertUser(values: typeof usersTable.$inferInsert) {
  try{
    const [ res ] = await db
      .insert(usersTable)
      .values({
          ...values,
      })
      .returning();
    
    return res;
  } catch(err) {
    console.error("Failed to insert User:", err)
    return null;
  }
}

export async function getUserIdById(userId: string) {
  try {
  const [res] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);

  return res;
  } catch(err) {
    console.error("Failed to get User:", err)
    return null;
  }
}

export async function updateUserById(userId: string, values: Partial<typeof usersTable.$inferInsert>) {
  try{
    const [ res ] = await db
      .update(usersTable)
      .set({
          ...values,
      })
      .where(eq(usersTable.id, userId))
      .returning();
    
    return res;
  } catch(err) {
    console.error("Failed to update User:", err)
    return null;
  }
}