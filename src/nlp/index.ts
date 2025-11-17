import { subscribe } from "@/events/broker";
import { summerizeEmail } from "@/nlp/listners/summeriser";
import { classifyUserIntent } from "@/nlp/listners/classifier";

export default async function main() {
  // register subscripers
  subscribe("email:new", "nlp", summerizeEmail)
  subscribe("message:user", "nlp", classifyUserIntent)
}
