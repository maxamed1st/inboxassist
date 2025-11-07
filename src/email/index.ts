import { subscribe } from "@/events/broker";
import { connect, disconnect, moveEmail, pruneEmails, sendEmail } from "@/email/utils/listners";

export default async function main() {
  /* register event listners */
  subscribe("email:connect", "email", connect);
  subscribe("email:prune", "email", pruneEmails);
  subscribe("email:disconnect", "email", disconnect);
  subscribe("action:send", "email", sendEmail);
  subscribe("action:move", "email", moveEmail);
}