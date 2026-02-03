import 'dotenv/config';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db } from '@/db/clients';

export default async function main() {
    await migrate(db, { migrationsFolder: "./drizzle"});
}
