import express from "express";
import { gmailCallback } from "@/email/api/handlers/gmail";
import { microsftCallback } from "./handlers/microsoft";

const router = express.Router();

router.use(express.json());
router.get("/gmail/callback", gmailCallback);
router.get("/microsoft/callback", microsftCallback);

export default router;
