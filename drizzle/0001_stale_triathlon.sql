ALTER TABLE "accounts" ALTER COLUMN "createdAt" SET DATA TYPE timestamp USING to_timestamp("createdAt" / 1000);--> statement-breakpoint
ALTER TABLE "accounts" ALTER COLUMN "updatedAt" SET DATA TYPE timestamp USING to_timestamp("updatedAt" / 1000);--> statement-breakpoint
ALTER TABLE "actions" ALTER COLUMN "createdAt" SET DATA TYPE timestamp USING to_timestamp("createdAt" / 1000);--> statement-breakpoint
ALTER TABLE "actions" ALTER COLUMN "updatedAt" SET DATA TYPE timestamp USING to_timestamp("updatedAt" / 1000);--> statement-breakpoint
ALTER TABLE "connections" ALTER COLUMN "createdAt" SET DATA TYPE timestamp USING to_timestamp("createdAt" / 1000);--> statement-breakpoint
ALTER TABLE "connections" ALTER COLUMN "updatedAt" SET DATA TYPE timestamp USING to_timestamp("updatedAt" / 1000);--> statement-breakpoint
ALTER TABLE "emails" ALTER COLUMN "createdAt" SET DATA TYPE timestamp USING to_timestamp("createdAt" / 1000);--> statement-breakpoint
ALTER TABLE "emails" ALTER COLUMN "updatedAt" SET DATA TYPE timestamp USING to_timestamp("updatedAt" / 1000);--> statement-breakpoint
ALTER TABLE "messages" ALTER COLUMN "createdAt" SET DATA TYPE timestamp USING to_timestamp("createdAt" / 1000);--> statement-breakpoint
ALTER TABLE "messages" ALTER COLUMN "updatedAt" SET DATA TYPE timestamp USING to_timestamp("updatedAt" / 1000);--> statement-breakpoint
ALTER TABLE "subscriptions" ALTER COLUMN "createdAt" SET DATA TYPE timestamp USING to_timestamp("createdAt" / 1000);--> statement-breakpoint
ALTER TABLE "subscriptions" ALTER COLUMN "updatedAt" SET DATA TYPE timestamp USING to_timestamp("updatedAt" / 1000);--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "createdAt" SET DATA TYPE timestamp USING to_timestamp("createdAt" / 1000);--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "updatedAt" SET DATA TYPE timestamp USING to_timestamp("updatedAt" / 1000);