import { insertConnection } from "@/db/queries/connections"
import { insertUser } from "@/db/queries/user"
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