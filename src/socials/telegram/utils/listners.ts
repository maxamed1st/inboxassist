import { getUserIdByTelegramId, insertConnection } from "@/db/queries/connections"
import { insertUser } from "@/db/queries/user"
import { publish } from "@/events/broker";

export async function initializeUser(TelegramUserId: string) {
    const user = await insertUser({ createdAt: new Date(), updatedAt: new Date()})

    if (!user) {
        console.error("Failed to create internal usear for telegram user:", TelegramUserId);
        return;
    };

    const connection = await insertConnection({
        userId: user.id,
        platform: "telegram",
        platformAccountId: TelegramUserId,
        createdAt: new Date(),
        updatedAt: new Date()
    });

    if(!connection) {
        console.error("Failed to create connection for:", user.id);
    }
}

export async function connectEmail(TelegramUserId: string) {
    const user = await getUserIdByTelegramId(TelegramUserId);
    if(!user) {
        console.error("Could not get userID for telegram user:", TelegramUserId)
        return;
    }
    await publish("email:login", { userId: user.id, platform: "gmail"})
}