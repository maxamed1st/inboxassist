import express from "express";
import { gmailCallback } from "@/email/api/handlers/gmail";

const router = express.Router();

router.get("/gmail/callback", gmailCallback);

export default router;
