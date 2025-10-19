import express from "express";
import { gmailCallback } from "@/email/api/handlers";

const router = express.Router();

router.get("/gmail/callback", gmailCallback);

export default router;