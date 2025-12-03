import { sql } from "drizzle-orm";
import { integer, pgTable, varchar, jsonb, uuid, boolean, timestamp, text } from "drizzle-orm/pg-core";
import type { EmailContent, ActionPayload } from "../db/types";

export const usersTable = pgTable("users", {
  id: uuid().primaryKey().defaultRandom(),
  email: text(),
  name: text(),
  subscriptionStatus: varchar({ length: 50 }),
  subscriptionId: varchar({ length: 255 }),
  createdAt: timestamp().notNull(),
  updatedAt: timestamp().notNull(),
});

export const accountsTable = pgTable("accounts", {
  id: uuid().primaryKey().defaultRandom(),
  userId: uuid()
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  provider: varchar({ length: 255 }).notNull(),
  providerAccountId: text().notNull(),
  accessToken: text().notNull(),
  refreshToken: text().notNull(),
  expiresAt: timestamp(),
  createdAt: timestamp().notNull(),
  updatedAt: timestamp().notNull(),
});

export const connectionsTable = pgTable("connections", {
  id: uuid().primaryKey().defaultRandom(),
  userId: uuid()
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  platform: varchar({ length: 255 }).notNull(),
  platformAccountId: varchar({ length: 255 }).notNull(),
  accessToken: text(),
  refreshToken: text(),
  expiresAt: timestamp(),
  createdAt: timestamp().notNull(),
  updatedAt: timestamp().notNull(),
});

export const emailsTable = pgTable("emails", {
  id: uuid().primaryKey().defaultRandom(),
  userId: uuid()
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  accountId: uuid()
    .notNull()
    .references(() => accountsTable.id, { onDelete: "cascade" }),
  externalEmailId: varchar({ length: 255 }).notNull(),
  imapUid:  integer().notNull(),
  inReplyTo: varchar({ length: 255 }),
  references: jsonb().default(sql`'[]'::jsonb`).notNull().$type<string[]>(),
  subject: varchar({ length: 998 }).notNull(),
  content: jsonb().notNull().$type<EmailContent>(),
  from: varchar({ length: 255 }).notNull(),
  to: text().notNull(),
  cc: text(),
  bcc: text(),
  date: timestamp().notNull(),
  status: varchar({ length: 50 }).notNull().$type<"received" | "draft" | "sent">(),
  createdAt: timestamp().notNull(),
  updatedAt: timestamp().notNull(),
});

export const actionsTable = pgTable("actions", {
  id: uuid().primaryKey().defaultRandom(),
  userId: uuid()
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  emailId: uuid()
    .references(() => emailsTable.id, { onDelete: "cascade" }),
  parentId: uuid()
    .references((): any => actionsTable.id, { onDelete: "set null" }),
  type: varchar({ length: 50 }).notNull().$type<"compose" | "edit" | "send" | "move">(),
  payload: jsonb().default(sql`'{}'::jsonb`).notNull().$type<ActionPayload>(),
  status: varchar({ length: 50 }).notNull().$type<"pending" | "processing" | "completed" | "failed">(),
  role: varchar({ length: 50 }).notNull().$type<"user" | "system">(),
  createdAt: timestamp().notNull(),
  updatedAt: timestamp().notNull(),
});

export const messagesTable = pgTable("messages", {
  id: uuid().primaryKey().defaultRandom(),
  userId: uuid()
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  emailId: uuid()
    .references(() => emailsTable.id, { onDelete: "set null" }),
  replyToId: uuid()
    .references((): any => messagesTable.id, { onDelete: "set null" }),
  platformMessageId: varchar({ length: 255 }),
  references: jsonb().default(sql`'[]'::jsonb`).notNull().$type<string[]>(),
  threadId: uuid()
    .references((): any => messagesTable.id, { onDelete: "set null" }),
  content: varchar({ length: 4096 }).notNull(),
  role: varchar({ length: 50 }).notNull().$type<"user" | "assistant" | "system">(),
  createdAt: timestamp().notNull(),
  updatedAt: timestamp().notNull(),
});

export const subscriptionsTable = pgTable("subscriptions", {
  id: uuid().primaryKey().defaultRandom(),
  userId: uuid()
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  provider: varchar({ length: 50 }).notNull().default("stripe"),
  providerCustomerId: varchar({ length: 255 }).notNull(),
  providerSubscriptionId: varchar({ length: 255 }).notNull(),
  plan: varchar({ length: 255 }).notNull(),
  status: varchar({ length: 50 }).notNull(),
  periodStart: integer().notNull(),
  periodEnd: integer().notNull(),
  cancelAtPeriodEnd: boolean().notNull(),
  createdAt: timestamp().notNull(),
  updatedAt: timestamp().notNull(),
});
