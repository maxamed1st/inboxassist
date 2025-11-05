import { usersTable } from "../schema";
import { db } from "../client";

export function insertUser(values: typeof usersTable.$inferInsert) {
  return db
    .insert(usersTable)
    .values({
        ...values,
    }
    )
    .returning();
}