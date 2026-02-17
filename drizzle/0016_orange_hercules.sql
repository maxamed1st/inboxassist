ALTER TABLE "messages" DROP CONSTRAINT "messages_emailId_emails_id_fk";
--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_emailId_emails_id_fk" FOREIGN KEY ("emailId") REFERENCES "public"."emails"("id") ON DELETE cascade ON UPDATE no action;