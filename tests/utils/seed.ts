import { db } from "@/db/clients";
import { usersTable } from "@/db/schema";
import { insertUser } from "@/db/queries/user";
import { insertConnection } from "@/db/queries/connections";
import { insertEmail } from "@/db/queries/emails";
import { insertAccount } from "@/db/queries/accounts";
import { encrypt } from "@/utils/encryption";

async function dbIsSeeded() {
  const users = await db.select().from(usersTable).limit(1);
  return users.length > 0;
}
export async function seedDB() {
  const now = new Date()
  const user = {
    id: "00000000-0000-0000-0000-000000000001",
    name: encrypt("user"),
    email: encrypt("user@example.com"),
    createdAt: now,
    updatedAt: now
  }

  const connection = {
    id: "00000000-0000-0000-0000-000000000002",
    userId: user.id,
    platform: "telegram",
    platformAccountId: "2",
    createdAt: now,
    updatedAt: now
  }

  const account = {
    id: "00000000-0000-0000-0000-000000000003",
    userId: user.id,
    provider: "microsoft",
    providerAccountId: user.email,
    providerIMAP: "outlook.office365.com",
    providerSMTP: "smtp.office365.com",
    accessToken: encrypt("none"),
    refreshToken: encrypt("none"),
    createdAt: now,
    updatedAt: now
  }

  const email = {
    id: "00000000-0000-0000-0000-000000000004",
    userId: user.id,
    accountId: account.id,
    externalEmailId: "4",
    imapUid: 123,
    subject: encrypt("Project update"),
    content: { text: encrypt("InboxAssist is now online.") },
    from: encrypt("other@example.com"),
    to: encrypt(account.providerAccountId),
    date: now,
    status: "received" as const,
    createdAt: now,
    updatedAt: now
  }

  const seeded = await dbIsSeeded()

  if (seeded) {
    console.log("Database is already seeded")
  } else {
    await insertUser(user);
    await insertConnection(connection);
    await insertAccount(account);
    await insertEmail(email);

    console.log("Database has been seeded");
  }

  return { user, account, connection, email }
}
