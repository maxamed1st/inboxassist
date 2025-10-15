import { googleOauth2Client } from "./clients.js";
import jwt from "jsonwebtoken";
import { insertAccount } from "./queries.js";

export async function gmailCallback(req: any, res: any) {
  try {
    const userId = Number(req.query.state);
    const { tokens } = await googleOauth2Client.getToken(req.query.code);

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

    return res.json({ success: true, providerAccountId });
  } catch (error) {
    console.error("Gmail OAuth callback error:", error);
    return res.status(500).json({ error: "OAuth callback failed" });
  }
}