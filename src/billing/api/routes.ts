import express from "express";
import { stripeWebhook } from "@/billing/api/handlers";

const router = express.Router();

router.post("/billing/webhook", express.raw({ type: "application/json" }), stripeWebhook);

export default router;
