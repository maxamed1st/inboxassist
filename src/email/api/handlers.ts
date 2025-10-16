import { googleOauth2Client } from "@/email/clients.js";
import jwt from "jsonwebtoken";
import { insertAccount } from "@/db/queries/accounts.js";
import type{ Request, Response } from "express";
import { refreshTokensQueue } from "@/email/cron/queue.js";

export async function gmailCallback(req: Request, res: Response) {
  try {
    const query = req.query as { code?: string; state?: string };
    if (!query.code || !query.state) {
      return res.status(400).json({ error: "Missing code or state in query" });
      console.error("Missing code or state in query", query);
    }
    
    const userId = Number(req.query.state);
    const { tokens } = await googleOauth2Client.getToken(query.code);

    // decode the user's email from the ID token
    const decoded = jwt.decode(tokens.id_token as string) as { email: string };
    const providerAccountId = decoded?.email ?? "unknown";

    // prepare values for DB insert
    const now = Math.floor(Date.now() / 1000);

    const values = {
      userId,
      provider: "google",
      providerAccountId,
      accessToken: tokens.access_token!,
      refreshToken: tokens.refresh_token!,
      expiresAt: Math.floor(tokens.expiry_date! / 1000),
      createdAt: now,
      updatedAt: now,
    };

    // insert into accounts table
    await insertAccount(values);

    // refresh tokens periodically
    refreshTokensQueue.add("refresh",
      { provider: "google", providerAccountId },
      {
        repeat: { every: 50 * 60 * 1000 },
        attempts: 3,
        backoff: { type: "exponential", delay: 60000 },
        removeOnComplete: true,
        removeOnFail: false,
      }
    );

    return res.json({ success: true, providerAccountId });
  } catch (error) {
    console.error("Gmail OAuth callback error:", error);
    return res.status(500).json({ error: "OAuth callback failed" });
  }
}