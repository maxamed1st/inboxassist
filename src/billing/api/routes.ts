import express from "express";
import { stripeWebhook } from "@/billing/api/handlers";

const router = express.Router();

router.post("/billing/webhook", stripeWebhook);

export default router;