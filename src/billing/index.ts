import { subscribe } from "@/events/broker";
import { checkout, customerPortal } from "./listners";

export default async function() {
  //register listners
  subscribe("billing:subscribe", "billing", checkout);
  subscribe("billing:manage", "billing", customerPortal);
}
