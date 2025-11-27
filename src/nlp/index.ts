import { subscribe } from "@/events/broker";
import { summerizeEmail } from "@/nlp/listners/summeriser";
import { classifyUserIntent } from "@/nlp/listners/classifier";
import { composeEmail } from "./listners/composer";
import { genericGPT } from "./listners/generic";

export default async function main() {
  // register subscripers
  subscribe("email:new", "nlp", summerizeEmail)
  subscribe("message:user", "nlp", classifyUserIntent)
  subscribe("action:compose", "nlp", composeEmail)
  subscribe("action:edit", "nlp", composeEmail)
  subscribe("action:unknown", "nlp", genericGPT);
}
