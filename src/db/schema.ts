import { integer, pgTable, varchar, text, boolean } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  email: varchar({ length: 255 }).notNull().unique(),
  name: varchar({ length: 255 }),
  credits: integer().default(0).notNull(),
  createdAt: integer().notNull(),
  updatedAt: integer().notNull(),
});

export const accountsTable = pgTable("accounts", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: integer()
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  provider: varchar({ length: 255 }).notNull(),
  providerAccountId: varchar({ length: 255 }).notNull(),
  accessToken: varchar({ length: 255 }).notNull(),
  refreshToken: varchar({ length: 255 }).notNull(),
  expiresAt: integer().notNull(),
});

export const connectionsTable = pgTable("connections", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: integer()
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  platform: varchar({ length: 255 }).notNull(),
  platformAccountId: varchar({ length: 255 }).notNull(),
  accessToken: varchar({ length: 255 }),
  refreshToken: varchar({ length: 255 }),
  expiresAt: integer(),
});

export const emailsTable = pgTable("emails", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: integer()
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  accountId: integer()
    .notNull()
    .references(() => accountsTable.id, { onDelete: "cascade" }),
  emailId: varchar({ length: 255 }).notNull(),
  subject: varchar({ length: 998 }).notNull(),
  body: text(),
  sender: varchar({ length: 255 }).notNull(),
  receivedAt: integer().notNull(),
});

export const actionsTable = pgTable("actions", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: integer()
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  emailId: integer()
    .notNull()
    .references(() => emailsTable.id, { onDelete: "cascade" }),
  actionType: varchar({ length: 50 }).notNull(),
  actionData: varchar({ length: 4096 }),
  status: varchar({ length: 50 }).notNull(),
  createdAt: integer().notNull(),
  updatedAt: integer().notNull(),
});

export const messagesTable = pgTable("messages", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: integer()
    .notNull()
    .references(() => usersTable.id),
  emailId: integer()
    .references(() => emailsTable.id),
  replyToId: integer()
    .references((): any => messagesTable.id),
  content: varchar({ length: 4096 }).notNull(),
  role: varchar({ length: 50 }).notNull().$type<"user" | "assistant" | "system">(),
  createdAt: integer().notNull(),
  updatedAt: integer().notNull(),
});