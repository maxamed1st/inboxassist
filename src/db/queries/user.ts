import { usersTable } from "../schema";
import { db } from "../client";

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