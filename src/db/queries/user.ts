import { usersTable } from "../schema";
import { db } from "../client";

export function insertUser(values: typeof usersTable.$inferInsert) {
  try{
    return db
      .insert(usersTable)
      .values({
          ...values,
      })
      .returning();
  } catch(err) {
    console.error("Failed to insert User:", err)
    return null;
  }
}