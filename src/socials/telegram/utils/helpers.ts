import { getUserIdByTelegramId, insertConnection } from "@/db/queries/connections"
import { insertUser } from "@/db/queries/user"
import { publish } from "@/events/broker";
import { bot } from "../client";

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
    const user = await getUserIdByTelegramId(telegramUserId);
    if(!user) {
        await bot.telegram.sendMessage(telegramUserId, "Please initialize your assistant first by sending /start");
        return;
    }
    await publish("email:connect", { userId: user.id, platform: "gmail"})
}

export async function disconnectEmail(telegramUserId: string) {
    const user = await getUserIdByTelegramId(telegramUserId);
    if(!user) {
        await bot.telegram.sendMessage(telegramUserId, "You have no email connected");
        return;
    }
    await publish("email:disconnect", { userId: user.id})
}

export async function subscribe(telegramUserId: string) {
    const user = await getUserIdByTelegramId(telegramUserId);
    if(!user) {
        await bot.telegram.sendMessage(telegramUserId, "You need to initialize your assistent with /start command first.");
        return;
    }
    await publish("billing:subscribe", { userId: user.id})
}

export async function manageSubscription(telegramUserId: string) {
    const user = await getUserIdByTelegramId(telegramUserId);
    if(!user) {
        await bot.telegram.sendMessage(telegramUserId, "You have no active subscription");
        return;
    }
    await publish("billing:manage", { userId: user.id})
}
