import { getUserIdByTelegramId, insertConnection } from "@/db/queries/connections"
import { insertUser } from "@/db/queries/user"
import { publish } from "@/events/broker";

export async function initializeUser(telegramUserId: string) {
    const existingUser = await getUserIdByTelegramId(telegramUserId);

    if(existingUser) {
        return { isNewUser: false };
    }

    // initialize new user
    const user = await insertUser({ createdAt: new Date(), updatedAt: new Date()})

    if (!user) {
        console.error("Failed to create internal usear for telegram user:", telegramUserId);
        return { isNewUser: null };
    };

    const connection = await insertConnection({
        userId: user.id,
        platform: "telegram",
        platformAccountId: telegramUserId,
        createdAt: new Date(),
        updatedAt: new Date()
    });

    if(!connection) {
        console.error("Failed to create telegram connection for:", user.id);
    }

    return { isNewUser: true, id: user.id }
}

export async function connectEmail(telegramUserId: string) {
    let user;
    user = await getUserIdByTelegramId(telegramUserId);
    if(!user) {
        user = await initializeUser(telegramUserId);
    }
    if(!user.id) {
        console.error("Could not get userID for telegram user:", telegramUserId)
        return;
    }
    await publish("email:connect", { userId: user.id, platform: "gmail"})
}