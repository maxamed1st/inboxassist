import express from "express";
import { gmailCallback } from "@/email/api/handlers.js";

const router = express.Router();

router.get("/gmail/callback", gmailCallback);

export default router;