import { subscribe } from "@/events/broker";
import { summerizeEmail } from "./utils/listners";

export default async function main() {
  // register subscripers
  subscribe("email:new", "nlp", summerizeEmail)
}