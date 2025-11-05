import { db } from "@/db/client";
import { connectionsTable } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function insertConnection(values: typeof connectionsTable.$inferInsert) {
  return db
     .insert(connectionsTable)
     .values({
         ...values,
     }
     )
     .returning();
}