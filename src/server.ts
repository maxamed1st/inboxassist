import express from "express";
import authRouter from "@/email/api/routes";
import webhookRouter from "@/billing/api/routes";

export default function server() {
    const app = express();
    const PORT = process.env.PORT || 3000;

    app.use(express.json());
    app.use(authRouter);
    app.use(webhookRouter);

    app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    });
}