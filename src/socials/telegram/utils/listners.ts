import { getUserIdByTelegramId, insertConnection } from "@/db/queries/connections"
import { insertUser } from "@/db/queries/user"
import { publish } from "@/events/broker";

export async function initializeUser(TelegramUserId: string) {
    const existingUser = await getUserIdByTelegramId(TelegramUserId);

    if(existingUser) {
        return { isNewUser: false };
    }

    // initialize new user
    const user = await insertUser({ createdAt: new Date(), updatedAt: new Date()})

    if (!user) {
        console.error("Failed to create internal usear for telegram user:", TelegramUserId);
        return { isNewUser: null };
    };

    const connection = await insertConnection({
        userId: user.id,
        platform: "telegram",
        platformAccountId: TelegramUserId,
        createdAt: new Date(),
        updatedAt: new Date()
    });

    if(!connection) {
        console.error("Failed to create telegram connection for:", user.id);
    }

    return { isNewUser: true }
}

export async function connectEmail(TelegramUserId: string) {
    const user = await getUserIdByTelegramId(TelegramUserId);
    if(!user) {
        console.error("Could not get userID for telegram user:", TelegramUserId)
        return;
    }
    await publish("email:login", { userId: user.id, platform: "gmail"})
}