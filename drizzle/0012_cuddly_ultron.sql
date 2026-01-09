ALTER TABLE "subscriptions" ALTER COLUMN "periodStart" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "subscriptions" ALTER COLUMN "periodEnd" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "subscriptionId" SET DATA TYPE varchar(255);