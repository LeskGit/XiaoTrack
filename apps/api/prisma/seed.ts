import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "argon2";
import { PrismaClient } from "../src/generated/prisma/client";
import type { Role } from "../src/generated/prisma/enums";

const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const required = (name: string): string => {
    const value = process.env[name];
    if (!value) throw new Error(`Missing ${name} in .env, please, enter the valid value`);
    return value;
}

const upsertUser = async (email: string, displayName: string, password: string, role: Role) => {
    const normalizedEmail = email.trim().toLowerCase();
    await prisma.user.upsert({
        where: { email: normalizedEmail },
        update: { role, displayName },
        create: { email: normalizedEmail, displayName, passwordHash: await hash(password), role },
    });
    console.log(`✔ ${role.padEnd(5)} ${normalizedEmail}`);
};

const main = async () => {
    await upsertUser(required("SEED_ADMIN_EMAIL"), "Admin", required("SEED_ADMIN_PASSWORD"), "ADMIN");

    if (process.env.NODE_ENV !== "production") {
        await upsertUser(required("SEED_TEST_EMAIL"), "Test", required("SEED_TEST_PASSWORD"), "USER");
    }
};

main()
    .catch((error: unknown) => {
        console.error(error);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());