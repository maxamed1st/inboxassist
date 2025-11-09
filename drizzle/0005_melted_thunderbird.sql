ALTER TABLE "accounts" ALTER COLUMN "accessToken" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "accounts" ALTER COLUMN "refreshToken" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "connections" ALTER COLUMN "accessToken" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "connections" ALTER COLUMN "refreshToken" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "emails" ALTER COLUMN "to" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "emails" ALTER COLUMN "cc" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "emails" ALTER COLUMN "cc" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "emails" ALTER COLUMN "cc" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "emails" ALTER COLUMN "bcc" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "emails" ALTER COLUMN "bcc" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "emails" ALTER COLUMN "bcc" DROP NOT NULL;