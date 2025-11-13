import { subscribe } from "@/events/broker";
import { classifyUserIntent, summerizeEmail } from "./utils/listners";

export default async function main() {
  // register subscripers
  subscribe("email:new", "nlp", summerizeEmail)
  subscribe("message:user", "nlp", classifyUserIntent)
}
