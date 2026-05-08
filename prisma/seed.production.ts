/**
 * Production seed — runs once on the production Neon database after migration.
 *
 * Contains ONLY:
 *   - Whiskey catalog (50 bottles — provide via WHISKEY_DATA env or JSON file)
 *   - Cocktail recipes (20 classics — provide via RECIPE_DATA env or JSON file)
 *
 * Does NOT contain:
 *   - Demo users (tres, brian)
 *   - Dev test data
 *   - Any content that shouldn't be public
 *
 * Run: pnpm db:seed:prod
 * (add "db:seed:prod": "tsx --env-file .env.production prisma/seed.production.ts" to package.json)
 *
 * PLACEHOLDER: The whiskey and recipe data arrays below are empty.
 * Ping the project owner for the locked JSON catalog before running.
 */

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// ─── Whiskey catalog ──────────────────────────────────────────────────────────
// TODO: Replace with locked 50-bottle JSON catalog when provided
const WHISKEYS: Array<{
  name: string;
  brand: string;
  category: "BOURBON" | "RYE" | "TENNESSEE" | "SCOTCH" | "IRISH" | "JAPANESE" | "OTHER";
  distillery?: string;
  proof?: number;
  ageYears?: number;
  description?: string;
}> = [
  // Data pending — will be provided as JSON by project owner
];

// ─── Cocktail recipes ─────────────────────────────────────────────────────────
// TODO: Replace with locked 20-recipe JSON catalog when provided
const RECIPES: Array<{
  title: string;
  description: string;
  ingredients: Array<{ amount: string; item: string }>;
  steps: string[];
  taggedWhiskeyName?: string;
}> = [
  // Data pending — will be provided as JSON by project owner
];

async function main() {
  console.log("Starting production seed...\n");

  // ── Whiskeys ────────────────────────────────────────────────────────────────
  if (WHISKEYS.length === 0) {
    console.warn("⚠  WHISKEYS array is empty — skipping whiskey seed.");
    console.warn("   Add the 50-bottle catalog JSON before running in production.");
  } else {
    let created = 0;
    for (const w of WHISKEYS) {
      const existing = await prisma.whiskey.findFirst({
        where: { name: w.name, brand: w.brand },
      });
      if (!existing) {
        await prisma.whiskey.create({ data: w });
        created++;
      }
    }
    console.log(`✓ Whiskeys: ${created} created, ${WHISKEYS.length - created} already existed`);
  }

  // ── Cocktail recipes ────────────────────────────────────────────────────────
  if (RECIPES.length === 0) {
    console.warn("⚠  RECIPES array is empty — skipping recipe seed.");
    console.warn("   Add the 20-recipe catalog JSON before running in production.");
  } else {
    // Recipes require a system user to own them — create one if it doesn't exist
    const systemUser = await prisma.user.upsert({
      where: { email: "catalog@ricked.app" },
      create: {
        email: "catalog@ricked.app",
        name: "Ricked Catalog",
        displayName: "Ricked",
        handle: "ricked_catalog",
        hasPickedHandle: true,
        emailVerified: new Date(),
        dateOfBirth: new Date("1990-01-01"),
      },
      update: {},
    });

    let created = 0;
    for (const r of RECIPES) {
      const existing = await prisma.recipe.findFirst({ where: { title: r.title, userId: systemUser.id } });
      if (!existing) {
        let taggedWhiskeyId: string | null = null;
        if (r.taggedWhiskeyName) {
          const whiskey = await prisma.whiskey.findFirst({
            where: { name: { equals: r.taggedWhiskeyName, mode: "insensitive" } },
            select: { id: true },
          });
          taggedWhiskeyId = whiskey?.id ?? null;
        }

        await prisma.recipe.create({
          data: {
            userId: systemUser.id,
            title: r.title,
            description: r.description,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ingredients: r.ingredients as any,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            steps: r.steps as any,
            taggedWhiskeyId,
            status: "APPROVED",
            isPublished: true,
          },
        });
        created++;
      }
    }
    console.log(`✓ Recipes: ${created} created, ${RECIPES.length - created} already existed`);
  }

  console.log("\n✓ Production seed complete.");
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
