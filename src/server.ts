import express from "express";
import authRouter from "@/email/routes.js"

export default function server() {
    const app = express();
    const PORT = process.env.PORT || 3000;

    app.use(express.json());
    app.use(authRouter);

    app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    });
}