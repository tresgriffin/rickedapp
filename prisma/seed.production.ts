/**
 * Production seed — runs once against the production Neon database.
 *
 * Seeds:
 *   - 50-bottle whiskey catalog (prisma/data/whiskeys.json)
 *   - 20 classic cocktail recipes (prisma/data/recipes.json)
 *
 * Does NOT seed demo users, dev test data, or any QA-only content.
 * Idempotent: skip rows that already exist (matched by name/title).
 *
 * Run: pnpm db:seed:prod
 */

import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";
import whiskeysRaw from "./data/whiskeys.json";
import recipesRaw from "./data/recipes.json";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ─── Type definitions matching the source JSON schemas ────────────────────────

interface WhiskeySource {
  brand: string;        // full product name e.g. "Jim Beam White Label"
  type: string;         // "Bourbon" | "Rye" | "Tennessee" | "Zero-Proof Bourbon" | etc.
  regionOrigin: string; // "Kentucky, USA" — not stored, no schema field
  abv: number;          // 40.0–50.5 for spirits, 0.0 for zero-proof; converted to proof (× 2)
  description: string;
  // Optional enrichment fields — mapped when present
  distillery?: string;
  mashBill?: string;
  ageYears?: number;
  // pipeline-only fields — ignored:
  // writingApproach, status, wordCount, notes
}

interface RecipeIngredientSource {
  name: string;
  amount: number | null; // null when the amount is a descriptor, e.g. "to fill" (soda water in Highball)
  unit: string | null;
  optional: boolean;
  order: number;
}

interface RecipeStepSource {
  order: number;
  text: string;
  tip: string | null;
  duration: number | null;
}

interface RecipeSource {
  name: string;
  description: string;
  rickNote: string | null;
  baseSpirit: string;
  difficulty: "EASY" | "MEDIUM" | "ADVANCED";
  safetyFlags: string[];
  ingredients: RecipeIngredientSource[];
  steps: RecipeStepSource[];
  // ignored: glassware, methods, prepTime, abvEstimate, status, tags
}

// ─── Field mappings ────────────────────────────────────────────────────────────

type BourbonCategory = "BOURBON" | "RYE" | "TENNESSEE" | "SCOTCH" | "IRISH" | "JAPANESE" | "OTHER" | "ZERO_PROOF";

const TYPE_TO_CATEGORY: Record<string, BourbonCategory> = {
  Bourbon:               "BOURBON",
  Tennessee:             "TENNESSEE",
  Rye:                   "RYE",
  "Scotch (Single Malt)": "SCOTCH",
  "Scotch (Blended)":    "SCOTCH",
  "Scotch (Blended Malt)": "SCOTCH",
  Irish:                 "IRISH",
  Japanese:              "JAPANESE",
  Canadian:              "OTHER",        // no CANADIAN enum value
  "Zero-Proof Bourbon":  "ZERO_PROOF",
  "Zero-Proof Whiskey":  "ZERO_PROOF",
  "Zero-Proof Spirit":   "ZERO_PROOF",
};

function mapWhiskey(w: WhiskeySource) {
  const category = TYPE_TO_CATEGORY[w.type] ?? "OTHER";
  const proof = Math.round(w.abv * 2 * 10) / 10; // e.g. 40.0 → 80, 45.2 → 90.4

  return {
    name: w.brand,    // source "brand" field is the full product name
    brand: w.brand,   // same value — brand/name separation can be refined later
    category,
    proof,
    description: w.description,
    // Optional enrichment fields — mapped when present in the source data
    ...(w.distillery !== undefined && { distillery: w.distillery }),
    ...(w.mashBill !== undefined && { mashBill: w.mashBill }),
    ...(w.ageYears !== undefined && { ageYears: w.ageYears }),
  };
}

function mapIngredient(ing: RecipeIngredientSource): { amount: string; item: string } {
  // null amount means the unit is itself the descriptor (e.g. "to fill" for soda water)
  const amount = ing.amount === null
    ? (ing.unit ?? "")
    : ing.unit ? `${ing.amount} ${ing.unit}` : `${ing.amount}`;
  return { amount, item: ing.name };
}

function mapStep(step: RecipeStepSource): string {
  return step.text;
}

function mapRecipe(r: RecipeSource) {
  const ingredients = [...r.ingredients]
    .sort((a, b) => a.order - b.order)
    .map(mapIngredient);

  const steps = [...r.steps]
    .sort((a, b) => a.order - b.order)
    .map(mapStep);

  // Append rickNote to description if present — it's contextual flavor text
  // that belongs near the description for catalog recipes that have no separate field.
  const description = r.rickNote
    ? `${r.description}\n\n${r.rickNote}`
    : r.description;

  return {
    title: r.name,
    description,
    ingredients,
    steps,
    difficulty: r.difficulty,
    safetyFlags: r.safetyFlags,
  };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const whiskeys = (whiskeysRaw as WhiskeySource[]).map(mapWhiskey);
  const recipes = (recipesRaw as RecipeSource[]).map(mapRecipe);

  console.log(`Production seed — ${whiskeys.length} whiskeys, ${recipes.length} recipes\n`);

  // ── Whiskeys ──────────────────────────────────────────────────────────────
  let wCreated = 0;
  let wSkipped = 0;

  for (const w of whiskeys) {
    const existing = await prisma.whiskey.findFirst({
      where: { name: { equals: w.name, mode: "insensitive" } },
    });
    if (existing) {
      wSkipped++;
    } else {
      await prisma.whiskey.create({ data: w });
      wCreated++;
    }
  }

  console.log(`✓ Whiskeys: ${wCreated} created, ${wSkipped} already existed`);

  // ── System user for catalog recipes ──────────────────────────────────────
  const systemUser = await prisma.user.upsert({
    where: { email: "catalog@ricked.app" },
    create: {
      email: "catalog@ricked.app",
      name: "Rick",
      displayName: "Rick",
      handle: "rick",
      bio: "Resident mixologist. Knows the recipes, will build you new ones.",
      avatarUrl: "/rick-avatar.png",
      hasPickedHandle: true,
      emailVerified: new Date(),
      dateOfBirth: new Date("1990-01-01"),
    },
    update: {
      name: "Rick",
      displayName: "Rick",
      handle: "rick",
      bio: "Resident mixologist. Knows the recipes, will build you new ones.",
      avatarUrl: "/rick-avatar.png",
    },
  });

  // ── Cocktail recipes ──────────────────────────────────────────────────────
  let rCreated = 0;
  let rUpdated = 0;
  let rSkipped = 0;

  for (const r of recipes) {
    const existing = await prisma.recipe.findFirst({
      where: { title: { equals: r.title, mode: "insensitive" }, userId: systemUser.id },
      select: { id: true, isAiGenerated: true },
    });

    if (existing) {
      if (!existing.isAiGenerated) {
        await prisma.recipe.update({
          where: { id: existing.id },
          data: { isAiGenerated: true },
        });
        rUpdated++;
      } else {
        rSkipped++;
      }
      continue;
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
        status: "APPROVED",
        isPublished: true,
        isAiGenerated: true,
      },
    });
    rCreated++;
  }

  console.log(`✓ Recipes:  ${rCreated} created, ${rUpdated} updated (isAiGenerated), ${rSkipped} already up to date`);
  console.log("\n✓ Production seed complete.");

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
