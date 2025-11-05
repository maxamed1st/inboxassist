import { getUserIdByTelegramId, insertConnection } from "@/db/queries/connections"
import { insertUser } from "@/db/queries/user"
import { publish } from "@/events/broker";

export async function initializeUser(TelegramUserId: string) {
    const user = await insertUser({ createdAt: new Date(), updatedAt: new Date()})

    if (!user[0]?.id) {
        console.error("Failed to create internal usear for telegram user:", TelegramUserId);
        return;
    };

    insertConnection({
        userId: user[0].id,
        platform: "telegram",
        platformAccountId: TelegramUserId,
        createdAt: new Date(),
        updatedAt: new Date()
    })
}

export async function connectEmail(TelegramUserId: string) {
    const user = await getUserIdByTelegramId(TelegramUserId);
    if(!user?.id) {
        console.error("Could not get userID for telegram user:", TelegramUserId)
        return;
    }
    publish("email:login", { userId: TelegramUserId, platform: "gmail"})
}