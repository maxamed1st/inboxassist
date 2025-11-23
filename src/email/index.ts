import { subscribe } from "@/events/broker";
import { connect, disconnect, pruneEmails, toggleEmailReadStatus } from "@/email/listners/commands";
import { sendEmail } from "@/email/listners/sendEmail"
import { moveEmail } from "@/email/listners/moveEmail"
import { createDraft } from "./listners/draftEmail";

export default async function main() {
  /* register event listners */
  subscribe("email:connect", "email", connect);
  subscribe("email:prune", "email", pruneEmails);
  subscribe("email:disconnect", "email", disconnect);
  subscribe("action:send", "email", sendEmail);
  subscribe("action:move", "email", moveEmail);
  subscribe("email:composed", "email", createDraft);
  subscribe("email:toggleReadStatus", "email", toggleEmailReadStatus);
}
