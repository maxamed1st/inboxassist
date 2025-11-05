import { subscribe } from "@/events/broker";
import { login, logout, moveEmail, pruneEmails, sendEmail } from "@/email/utils";

export default async function main() {
  /* register event listners */
  subscribe("email:login", "email", login);
  subscribe("email:prune", "email", pruneEmails);
  subscribe("email:logout", "email", logout);
  subscribe("action:send", "email", sendEmail);
  subscribe("action:move", "email", moveEmail);
}