/**
 * One-time migration: copies RecipeRating.stars → RecipeReview.
 * Idempotent: skips any (userId, recipeId) pair that already has a RecipeReview.
 * The existing review wins — user-written reviews take precedence over publish-flow ratings.
 *
 * Run against production:
 *   DATABASE_URL="postgresql://..." npx tsx prisma/migrate-recipe-ratings.ts
 */

import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const ratings = await prisma.recipeRating.findMany({
    where: { stars: { not: null } },
    select: { userId: true, recipeId: true, stars: true, createdAt: true },
  });

  console.log(`Found ${ratings.length} RecipeRating rows with stars to migrate.`);

  let created = 0;
  let skipped = 0;

  for (const r of ratings) {
    const existing = await prisma.recipeReview.findUnique({
      where: { userId_recipeId: { userId: r.userId, recipeId: r.recipeId } },
      select: { id: true },
    });

    if (existing) {
      skipped++;
      continue;
    }

    await prisma.recipeReview.create({
      data: {
        userId: r.userId,
        recipeId: r.recipeId,
        rating: r.stars!,
        body: null,
        status: "APPROVED",
        createdAt: r.createdAt,
        updatedAt: r.createdAt,
      },
    });
    created++;
  }

  console.log(`✓ Migration complete: ${created} created, ${skipped} already existed (skipped).`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
