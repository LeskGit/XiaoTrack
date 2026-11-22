import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "argon2";
import { PrismaClient } from "../src/generated/prisma/client";
import type { Role } from "../src/generated/prisma/enums";
import { exercises, type SeedExercise } from "./seed-data/exercises";

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

// The file is the source of truth for provided exercises: re-seeding brings the database back in line with it
const upsertProvidedExercise = async ({ slug, name, category, measureType }: SeedExercise) => {
    await prisma.exercise.upsert({
        where: { slug },
        update: { name, category, measureType },
        create: { slug, name, category, measureType },
    });
};

const main = async () => {
    await upsertUser(required("SEED_ADMIN_EMAIL"), "Admin", required("SEED_ADMIN_PASSWORD"), "ADMIN");

    if (process.env.NODE_ENV !== "production") {
        await upsertUser(required("SEED_TEST_EMAIL"), "Test", required("SEED_TEST_PASSWORD"), "USER");
    }

    // One after the other: 33 small queries, no need to run them in parallel
    for (const exercise of exercises) {
        await upsertProvidedExercise(exercise);
    }
    console.log(`✔ ${exercises.length} provided exercises`);
};

main()
    .catch((error: unknown) => {
        console.error(error);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());