CREATE TABLE "accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"provider" varchar(255) NOT NULL,
	"providerAccountId" varchar(255) NOT NULL,
	"accessToken" varchar(255) NOT NULL,
	"refreshToken" varchar(255) NOT NULL,
	"expiresAt" integer,
	"createdAt" integer NOT NULL,
	"updatedAt" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "actions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"emailId" uuid,
	"parentId" uuid,
	"type" varchar(50) NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" varchar(50) NOT NULL,
	"role" varchar(50) NOT NULL,
	"createdAt" integer NOT NULL,
	"updatedAt" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "connections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"platform" varchar(255) NOT NULL,
	"platformAccountId" varchar(255) NOT NULL,
	"accessToken" varchar(255),
	"refreshToken" varchar(255),
	"expiresAt" integer,
	"createdAt" integer NOT NULL,
	"updatedAt" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "emails" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"accountId" uuid NOT NULL,
	"emailId" varchar(255) NOT NULL,
	"inReplyTo" varchar(255),
	"references" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"subject" varchar(998) NOT NULL,
	"content" jsonb NOT NULL,
	"from" varchar(255) NOT NULL,
	"to" jsonb NOT NULL,
	"cc" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"bcc" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"date" integer NOT NULL,
	"status" varchar(50) NOT NULL,
	"createdAt" integer NOT NULL,
	"updatedAt" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"emailId" uuid,
	"replyToId" uuid,
	"references" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"content" varchar(4096) NOT NULL,
	"role" varchar(50) NOT NULL,
	"createdAt" integer NOT NULL,
	"updatedAt" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"provider" varchar(50) DEFAULT 'stripe' NOT NULL,
	"providerCustomerId" varchar(255) NOT NULL,
	"providerSubscriptionId" varchar(255) NOT NULL,
	"plan" varchar(255) NOT NULL,
	"status" varchar(50) NOT NULL,
	"periodStart" integer NOT NULL,
	"periodEnd" integer NOT NULL,
	"cancelAtPeriodEnd" boolean NOT NULL,
	"createdAt" integer NOT NULL,
	"updatedAt" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255),
	"name" varchar(255),
	"subscriptionStatus" varchar(50),
	"subscriptionId" integer,
	"createdAt" integer NOT NULL,
	"updatedAt" integer NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "actions" ADD CONSTRAINT "actions_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "actions" ADD CONSTRAINT "actions_emailId_emails_id_fk" FOREIGN KEY ("emailId") REFERENCES "public"."emails"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "actions" ADD CONSTRAINT "actions_parentId_actions_id_fk" FOREIGN KEY ("parentId") REFERENCES "public"."actions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "connections" ADD CONSTRAINT "connections_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "emails" ADD CONSTRAINT "emails_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "emails" ADD CONSTRAINT "emails_accountId_accounts_id_fk" FOREIGN KEY ("accountId") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_emailId_emails_id_fk" FOREIGN KEY ("emailId") REFERENCES "public"."emails"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_replyToId_messages_id_fk" FOREIGN KEY ("replyToId") REFERENCES "public"."messages"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;