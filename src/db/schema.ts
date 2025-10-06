import { integer, pgTable, varchar } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  email: varchar({ length: 255 }).notNull().unique(),
  name: varchar({ length: 255 }),
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