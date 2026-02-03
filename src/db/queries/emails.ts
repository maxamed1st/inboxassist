import { db } from "@/db/clients";
import { emailsTable } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function deleteEmailsByUserId(userId: string) {
  try {
    const res = await db
      .delete(emailsTable)
      .where(eq(emailsTable.userId, userId))

      return res;
  } catch(err) {
    console.error("Failed to delete emails:", err)
    return null;
  }
}

export async function getEmailById(emailId: string) {
  try {
    const [ res ] = await db
      .select()
      .from(emailsTable)
      .where(eq(emailsTable.id, emailId))
      .limit(1)

    return res;
  } catch(err) {
    console.error("Failed to get Email", err)
    return null
  }
}

export async function getEmailByExtrernalEmailId(externalEmailId: string) {
  try {
    const [ res ] = await db
      .select()
      .from(emailsTable)
      .where(eq(emailsTable.externalEmailId, externalEmailId))
      .limit(1)

    return res;
  } catch(err) {
    console.error("Failed to get Email", err)
    return null
  }
}

export async function insertEmail(emailData: typeof emailsTable.$inferInsert) {
  try {
    const [ res ] = await db
      .insert(emailsTable)
      .values(emailData)
      .returning();

    return res;
  } catch(err) {
    console.error("Failed to insert Email", err)
    return null
  }
}

export async function updateEmailById(emailId: string, values: Partial<typeof emailsTable.$inferInsert>) {
  try{
    const [ res ] = await db
      .update(emailsTable)
      .set({
          ...values,
      }
      )
      .where(eq(emailsTable.id, emailId))
      .returning();

    return res;
  } catch(err) {
    console.error("Failed to update account", err)
    return null
  }
}
