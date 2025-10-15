import express from "express";
import { gmailCallback } from "./handlers.js";

const router = express.Router();

router.get("/gmail/callback", gmailCallback);

export default router;