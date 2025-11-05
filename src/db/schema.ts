import { sql } from "drizzle-orm";
import { integer, pgTable, varchar, jsonb, uuid, boolean } from "drizzle-orm/pg-core";
import type { EmailContent, ActionPayload } from "../db/types";

export const usersTable = pgTable("users", {
  id: uuid().primaryKey().defaultRandom(),
  email: varchar({ length: 255 }).unique(),
  name: varchar({ length: 255 }),
  subscriptionStatus: varchar({ length: 50 }),
  subscriptionId: integer(),
  createdAt: integer().notNull(),
  updatedAt: integer().notNull(),
});

export const accountsTable = pgTable("accounts", {
  id: uuid().primaryKey().defaultRandom(),
  userId: uuid()
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  provider: varchar({ length: 255 }).notNull(),
  providerAccountId: varchar({ length: 255 }).notNull(),
  accessToken: varchar({ length: 255 }).notNull(),
  refreshToken: varchar({ length: 255 }).notNull(),
  expiresAt: integer(),
  createdAt: integer().notNull(),
  updatedAt: integer().notNull(),
});

export const connectionsTable = pgTable("connections", {
  id: uuid().primaryKey().defaultRandom(),
  userId: uuid()
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  platform: varchar({ length: 255 }).notNull(),
  platformAccountId: varchar({ length: 255 }).notNull(),
  accessToken: varchar({ length: 255 }),
  refreshToken: varchar({ length: 255 }),
  expiresAt: integer(),
  createdAt: integer().notNull(),
  updatedAt: integer().notNull(),
});

export const emailsTable = pgTable("emails", {
  id: uuid().primaryKey().defaultRandom(),
  userId: uuid()
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  accountId: uuid()
    .notNull()
    .references(() => accountsTable.id, { onDelete: "cascade" }),
  emailId: varchar({ length: 255 }).notNull(),
  inReplyTo: varchar({ length: 255 }),
  references: jsonb().default(sql`'[]'::jsonb`).notNull().$type<string[]>(),
  subject: varchar({ length: 998 }).notNull(),
  content: jsonb().notNull().$type<EmailContent>(),
  from: varchar({ length: 255 }).notNull(),
  to: jsonb().notNull().$type<string[]>(),
  cc: jsonb().default(sql`'[]'::jsonb`).notNull().$type<string[]>(),
  bcc: jsonb().default(sql`'[]'::jsonb`).notNull().$type<string[]>(),
  date: integer().notNull(),
  status: varchar({ length: 50 }).notNull().$type<"received" | "draft" | "sent">(),
  createdAt: integer().notNull(),
  updatedAt: integer().notNull(),
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
  createdAt: integer().notNull(),
  updatedAt: integer().notNull(),
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
  references: jsonb().default(sql`'[]'::jsonb`).notNull().$type<string[]>(),
  content: varchar({ length: 4096 }).notNull(),
  role: varchar({ length: 50 }).notNull().$type<"user" | "assistant" | "system">(),
  createdAt: integer().notNull(),
  updatedAt: integer().notNull(),
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
  createdAt: integer().notNull(),
  updatedAt: integer().notNull(),
});
