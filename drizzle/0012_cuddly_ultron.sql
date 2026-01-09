ALTER TABLE "subscriptions" ALTER COLUMN "periodStart" SET DATA TYPE timestamp USING to_timestamp("periodStart");--> statement-breakpoint
ALTER TABLE "subscriptions" ALTER COLUMN "periodEnd" SET DATA TYPE timestamp USING to_timestamp("periodEnd");--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "subscriptionId" SET DATA TYPE varchar(255);
