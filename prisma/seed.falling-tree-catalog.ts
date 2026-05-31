/**
 * Catalog seed for ep-falling-tree (production database).
 * Seeds: 8 zero-proof bottles + 7 extra bourbons + 4 zero-proof recipes.
 * Idempotent — skips rows that already exist by name/title.
 * Rick user resolved by handle lookup; works against any database.
 *
 * Run: DATABASE_URL="<falling-tree-url>" ./node_modules/.bin/tsx prisma/seed.falling-tree-catalog.ts
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

// ─── Bottle data ──────────────────────────────────────────────────────────────

interface BottleData {
  name: string;
  brand: string;
  category: "BOURBON" | "ZERO_PROOF";
  proof: number;
  ageYears?: number;
  distillery?: string;
  mashBill?: string;
  description: string;
}

const ZERO_PROOF_BOTTLES: BottleData[] = [
  {
    name: "Spiritless Kentucky 74",
    brand: "Spiritless Kentucky 74",
    category: "ZERO_PROOF",
    proof: 0,
    description: "The Louisville-made zero-proof bourbon that starts with real bourbon and removes the alcohol through vacuum distillation. The process preserves flavor in a way most zero-proof bottles can't match. Caramel, vanilla, charred oak, and a touch of smoke on the finish. Lighter in body than full-proof bourbon, which is the honest tradeoff, but the flavor structure is genuinely bourbon-shaped. Drinks neat, and shines in an Old Fashioned mocktail where the bitters and sugar do their usual work. Spiritless built this category in a serious way, and Kentucky 74 remains the reference for what zero-proof bourbon can do.",
  },
  {
    name: "Lyre's American Malt",
    brand: "Lyre's American Malt",
    category: "ZERO_PROOF",
    proof: 0,
    description: "The Australian zero-proof spirit modeled on American whiskey, from Lyre's, the global category leader in non-alcoholic spirits. Oak-forward with vanilla, caramel, and dried fruit, plus a touch of smoke and spice on the finish. The profile reads closer to a younger American whiskey than to a heavy bourbon, which makes Lyre's American Malt cocktail-versatile in a way some zero-proof bottles aren't. Works in an Old Fashioned, a Whiskey Sour, or a Manhattan-style stirred drink where you want whiskey's flavor backbone without the alcohol. Mid-tier in the zero-proof category, widely available, and an easy entry point.",
  },
  {
    name: "Ritual Zero Proof Whiskey Alternative",
    brand: "Ritual Zero Proof Whiskey Alternative",
    category: "ZERO_PROOF",
    proof: 0,
    description: "The zero-proof whiskey alternative from Ritual, built from botanicals rather than dealcoholized whiskey. That's a different approach than most zero-proof bottles, and it shows in the profile: a lighter body, brighter aromatics, and a finish that fades faster than a dealcoholized spirit's. Vanilla, caramel, oak, and a peppery edge on the back end. Sits in approachable territory rather than serious-sipping. Where Ritual lands is in cocktails, carrying character through lemon and sugar in a way some heavier zero-proof bottles struggle with. Widely available at Whole Foods and Target, which makes it the easiest zero-proof bottle to find.",
  },
  {
    name: "Free Spirits The Spirit of Bourbon",
    brand: "Free Spirits The Spirit of Bourbon",
    category: "ZERO_PROOF",
    proof: 0,
    description: "The bourbon-style zero-proof spirit from Free Spirits, with B vitamins and amino acids built into the formula, a wellness-adjacent positioning that sets the brand apart in the category. Balanced sweetness, vanilla, caramel, and a touch of oak on the back end. The Spirit of Bourbon leans more toward authentic bourbon notes than some zero-proof bottles, which makes it the natural choice for Old Fashioned mocktails where you want the spirit to be recognizable. Drinks fine on the rocks for a quiet sip, but the cocktail use case is where this bottle does its best work.",
  },
  {
    name: "Monday Zero Alcohol Whiskey",
    brand: "Monday Zero Alcohol Whiskey",
    category: "ZERO_PROOF",
    proof: 0,
    description: "The cinnamon-forward zero-proof whiskey from Monday, built explicitly for cocktails rather than neat sipping. Heavy on baking spice up front, with cinnamon, nutmeg, and clove riding above the usual zero-proof vanilla and caramel base. The spice profile is more pronounced than most zero-proof bottles, which makes Monday excellent in a Whiskey Sour where the lemon plays against the cinnamon, or in a Highball where the soda lifts the spice notes. Less compelling neat, where the spice can feel one-note without a cocktail's structure around it. Sits at an everyday price.",
  },
  {
    name: "NKD Distillery NA Whiskey",
    brand: "NKD Distillery NA Whiskey",
    category: "ZERO_PROOF",
    proof: 0,
    description: "The non-alcoholic whiskey from NKD Distillery, a newer entry in the zero-proof category that's designed for neat drinking rather than cocktails. Where most zero-proof whiskeys focus on cocktail versatility, NKD goes the other direction. Clean heat on the palate, subtle smoke on the finish, and a body that's heavier than most zero-proof bottles manage. The result is something that drinks more like a contemplative sip than a mixer ingredient. Less established than Spiritless or Lyre's, but worth seeking out if neat is your goal. Premium territory price-wise.",
  },
  {
    name: "Sylva",
    brand: "Sylva",
    category: "ZERO_PROOF",
    proof: 0,
    description: "The craft-tier zero-proof spirit from Ben Branson, the founder of Seedlip. Sylva is made from foraged wood and developed through a proprietary sonic maturation technique that the producer says builds complexity in weeks rather than years. The result is a spirit that doesn't directly mirror bourbon or whiskey but lands in adjacent territory: earthy, woody, slightly smoky, with herbal and forest-floor notes underneath. Best neat or with a single rock. Limited availability and premium pricing put Sylva in occasion territory rather than everyday. Worth trying for anyone who takes zero-proof seriously.",
  },
  {
    name: "ISH Bourbon",
    brand: "ISH Bourbon",
    category: "ZERO_PROOF",
    proof: 0,
    description: "The Danish zero-proof bourbon from ISH, increasingly available in the US after building a following across Europe. Vanilla, caramel, oak, and a soft fruit note that pulls the profile slightly away from the heavier American bourbons toward something a touch lighter and brighter. The body is medium for the category, the finish runs clean rather than long. ISH Bourbon sits at a mid-tier price and works well in cocktails where you want zero-proof bourbon character without the heavier sweetness some American zero-proof bottles bring. A useful bottle for a Whiskey Sour or a Highball.",
  },
];

const EXTRA_BOURBONS: BottleData[] = [
  {
    name: "Blanton's Original Single Barrel",
    brand: "Buffalo Trace Distillery",
    category: "BOURBON",
    proof: 93,
    distillery: "Buffalo Trace Distillery, Frankfort, KY",
    mashBill: "~12-15% rye (Mash Bill #2) — exact recipe not disclosed",
    description: "Blanton's was the first commercial single barrel bourbon, released in 1984, and the bottle alone — that round, distinctive shape with the stopper shaped like a horse and jockey — has made it one of the most recognizable spirits in the world. The whiskey inside uses Buffalo Trace's higher-rye Mash Bill #2, which gives it a little more spice than the regular Buffalo Trace. Caramel, citrus, and toasted oak are the main players. The reality: it's genuinely good, but the bottle is now worth more than the whiskey to many collectors, which has made it nearly impossible to find at MSRP.",
  },
  {
    name: "Four Roses Single Barrel",
    brand: "Four Roses Distillery",
    category: "BOURBON",
    proof: 100,
    distillery: "Four Roses Distillery, Lawrenceburg, KY",
    mashBill: "60% corn, 35% rye, 5% malted barley (OBSV recipe)",
    description: "Four Roses is one of the more interesting stories in bourbon — they actually use 10 different recipes (2 mash bills × 5 yeast strains) and blend or single-barrel from them. The Single Barrel release is typically their OBSV recipe: the high-rye mash bill with a spicy yeast strain, which gives you big fruit and floral notes alongside that rye kick. Each barrel is different, so your bottle might vary from someone else's, which is part of the fun. At 100 proof it has presence without being overwhelming.",
  },
  {
    name: "Henry McKenna 10 Year Single Barrel",
    brand: "Heaven Hill Distilleries",
    category: "BOURBON",
    proof: 100,
    ageYears: 10,
    distillery: "Heaven Hill Distilleries, Bardstown, KY",
    mashBill: "75% corn, 13% rye, 12% malted barley",
    description: "Henry McKenna 10 Year is a Bottled-in-Bond single barrel, which is a legal designation that means a lot: it's from one distillery, one distillation season, one barrel, and it's at least 4 years old and bottled at exactly 100 proof. McKenna hits all those marks and then some — it's 10 years old, which is rare for a BIB at this price. Expect rich vanilla, caramel, and a solid rye backbone with some dried fruit on the way out. Won a bunch of awards a few years back and still hasn't fully recovered its shelf presence. Worth seeking out.",
  },
  {
    name: "Jefferson's Reserve Very Small Batch",
    brand: "Jefferson's Bourbon",
    category: "BOURBON",
    proof: 90.2,
    distillery: "Various distilleries (blended by Jefferson's)",
    mashBill: "~80% corn, 7% rye, 7% malted barley, 6% wheat",
    description: "Jefferson's Reserve is interesting because it's a blend — Jefferson's sources whiskey from multiple distilleries and ages, then blends them to a consistent flavor profile. The result is something that doesn't taste like any single distillery's house style, with layers of dried fruit, vanilla, toasted oak, and a gentle grain sweetness. The 'very small batch' on the label means each batch is different, though the house flavor stays consistent. It's a little more expensive than comparable bottles but rewards anyone who wants something that's harder to place.",
  },
  {
    name: "Old Forester 1920 Prohibition Style",
    brand: "Brown-Forman",
    category: "BOURBON",
    proof: 115,
    distillery: "Old Forester Distilling Co., Louisville, KY",
    mashBill: "72% corn, 18% rye, 10% malted barley",
    description: "Old Forester 1920 is the bold sibling in the Old Forester lineup, bottled at 115 proof to mimic the proof level the distillery reportedly used during Prohibition when selling for 'medicinal purposes.' That extra proof means you get more of everything — the vanilla and caramel are richer, the dark fruit is more intense, and the finish goes on longer. It has the kind of weight that makes you actually think about what you're drinking. Add a little water or one big ice cube and it opens up beautifully.",
  },
  {
    name: "Russell's Reserve 10 Year",
    brand: "Wild Turkey Distillery",
    category: "BOURBON",
    proof: 90,
    ageYears: 10,
    distillery: "Wild Turkey Distillery, Lawrenceburg, KY",
    mashBill: "75% corn, 13% rye, 12% malted barley",
    description: "Russell's Reserve 10 Year is what happens when Wild Turkey's Master Distillers (Jimmy and Eddie Russell) have 10 years and decide to dial the proof back to 90 instead of the 101 you get in the flagship. The lower proof makes it gentler and more approachable, while the extra aging adds layers — honey, baking spice, soft wood tannins, a little citrus. It's not trying to be bold; it's trying to be balanced, and it succeeds. A great option when you want something thoughtful rather than something that announces itself.",
  },
  {
    name: "Weller Special Reserve",
    brand: "Buffalo Trace Distillery",
    category: "BOURBON",
    proof: 90,
    distillery: "Buffalo Trace Distillery, Frankfort, KY",
    mashBill: "~0% rye — wheat as secondary grain (exact recipe not disclosed)",
    description: "Weller Special Reserve is a wheated bourbon from Buffalo Trace — the same distillery that makes Pappy Van Winkle, and reportedly using a similar wheat-forward mash bill. That connection has made it one of the most hunted bottles in bourbon. The actual whiskey? Soft, sweet, and approachable. Honey, vanilla, caramel, light fruit. It's not complex, but it's pleasant and easy to drink. At MSRP it's a solid everyday pour. At the $80–150 secondary market price some retailers charge? You're mostly paying for the label.",
  },
];

// ─── Recipe data ─────────────────────────────────────────────────────────────

interface IngredientData { name: string; amount: number | null; unit: string | null; order: number; }
interface StepData { order: number; text: string; }
interface RecipeData {
  name: string;
  description: string;
  rickNote: string | null;
  ingredients: IngredientData[];
  steps: StepData[];
}

const ZERO_PROOF_RECIPES: RecipeData[] = [
  {
    name: "Zero-Proof Old Fashioned",
    description: "A zero-proof version of the bourbon-forward classic, built on sugar, bitters, and citrus oils with a zero-proof bourbon base. The Old Fashioned's structure carries the cocktail in a way that other classics struggle to match without alcohol, which is why this is the easiest classic to translate to zero-proof.",
    rickNote: "The Old Fashioned translates better to zero-proof than almost any other classic. The sugar, bitters, and citrus oils do most of the structural work, so the spirit's lighter body doesn't hurt the drink the way it would in a Manhattan or Sazerac. Spiritless Kentucky 74 or Free Spirits give the closest bourbon character. Zero-proof bitters keep this strictly alcohol-free.",
    ingredients: [
      { name: "zero-proof bourbon", amount: 2, unit: "oz", order: 1 },
      { name: "simple syrup", amount: 0.25, unit: "oz", order: 2 },
      { name: "zero-proof aromatic bitters", amount: 2, unit: "dash", order: 3 },
      { name: "orange peel", amount: 1, unit: null, order: 4 },
    ],
    steps: [
      { order: 1, text: "Add simple syrup and bitters to a rocks glass." },
      { order: 2, text: "Add zero-proof bourbon and a large ice cube. Stir until well-chilled, about 30 seconds." },
      { order: 3, text: "Express the orange peel over the glass by pinching it skin-side-down to release the oils, then drop it in." },
    ],
  },
  {
    name: "Zero-Proof Whiskey Sour",
    description: "A zero-proof version of the classic shaken sour, built on zero-proof whiskey, lemon juice, and simple syrup. The optional egg white version produces the same silky foam as the alcoholic version and rounds out the texture in the same way.",
    rickNote: "Whiskey Sour structure (citrus, sweetener, foam) carries flavor more than alcohol does, which makes this one of the best zero-proof cocktail translations. Monday or Lyre's give the most expressive base. Egg white still makes a real difference. Aquafaba works as a vegan substitute.",
    ingredients: [
      { name: "zero-proof whiskey", amount: 2, unit: "oz", order: 1 },
      { name: "lemon juice (fresh)", amount: 0.75, unit: "oz", order: 2 },
      { name: "simple syrup", amount: 0.75, unit: "oz", order: 3 },
      { name: "egg white", amount: 1, unit: null, order: 4 },
      { name: "zero-proof aromatic bitters", amount: 2, unit: "dash", order: 5 },
      { name: "alcohol-free brandied cherry", amount: 1, unit: null, order: 6 },
    ],
    steps: [
      { order: 1, text: "If using egg white, add it to a shaker with the zero-proof whiskey, lemon juice, and simple syrup. Shake hard without ice for about 15 seconds to build the foam." },
      { order: 2, text: "Add ice to the shaker and shake again until well-chilled, about 15 seconds." },
      { order: 3, text: "Strain into a rocks glass over fresh ice. If skipping egg white, just shake once with ice and strain." },
      { order: 4, text: "Garnish with an alcohol-free brandied cherry. If using egg white, dot a few drops of zero-proof bitters on the foam." },
    ],
  },
  {
    name: "Zero-Proof Highball",
    description: "A long, refreshing build of zero-proof whiskey over ice topped with cold soda water and a lemon peel. The simplest zero-proof recipe and the most forgiving, since any zero-proof bottle works as the base.",
    rickNote: "The Highball is where zero-proof whiskey actually shines, because the soda water lifts the spirit's character rather than asking it to carry the drink alone. Any of the zero-proof bottles work here. Lyre's, Monday, and ISH all build a clean Highball.",
    ingredients: [
      { name: "zero-proof whiskey", amount: 1.5, unit: "oz", order: 1 },
      { name: "soda water", amount: null, unit: "to fill", order: 2 },
      { name: "lemon peel", amount: 1, unit: null, order: 3 },
    ],
    steps: [
      { order: 1, text: "Fill a highball glass with ice." },
      { order: 2, text: "Add zero-proof whiskey." },
      { order: 3, text: "Top with cold soda water and stir gently to combine." },
      { order: 4, text: "Express the lemon peel over the glass by pinching it skin-side-down to release the oils, then drop it in." },
    ],
  },
  {
    name: "Zero-Proof Hot Toddy",
    description: "A zero-proof version of the hot whiskey-and-honey drink. Hot water, lemon, honey, and zero-proof whiskey in a mug. The Hot Toddy's structure depends so much on the lemon-honey-water core that the whiskey contribution is minimal, which makes this an easy and successful zero-proof translation.",
    rickNote: "If the Old Fashioned is the easiest classic to translate to zero-proof, the Hot Toddy is even easier. The honey and lemon do most of the work, and the hot water hides any thinness in the spirit's body. Any zero-proof whiskey works here, including ones that feel underwhelming neat.",
    ingredients: [
      { name: "zero-proof whiskey", amount: 1.5, unit: "oz", order: 1 },
      { name: "lemon juice (fresh)", amount: 0.5, unit: "oz", order: 2 },
      { name: "honey", amount: 1, unit: "tsp", order: 3 },
      { name: "hot water", amount: 6, unit: "oz", order: 4 },
      { name: "lemon wheel", amount: 1, unit: null, order: 5 },
      { name: "cloves", amount: 2, unit: null, order: 6 },
      { name: "cinnamon stick", amount: 1, unit: null, order: 7 },
    ],
    steps: [
      { order: 1, text: "Add the honey to the mug and pour in a small amount of hot water to dissolve it. Stir until fully combined." },
      { order: 2, text: "Add zero-proof whiskey, lemon juice, and the rest of the hot water. Stir to combine." },
      { order: 3, text: "Stud the lemon wheel with the cloves if using, and float on top." },
      { order: 4, text: "Add the cinnamon stick if using." },
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mapIngredient(ing: IngredientData): { amount: string; item: string } {
  const amount = ing.amount === null
    ? (ing.unit ?? "")
    : ing.unit ? `${ing.amount} ${ing.unit}` : `${ing.amount}`;
  return { amount, item: ing.name };
}

function mapRecipe(r: RecipeData) {
  const description = r.rickNote ? `${r.description}\n\n${r.rickNote}` : r.description;
  const ingredients = [...r.ingredients].sort((a, b) => a.order - b.order).map(mapIngredient);
  const steps = [...r.steps].sort((a, b) => a.order - b.order).map((s) => s.text);
  return { title: r.name, description, ingredients, steps };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function seedBottles(bottles: BottleData[], label: string) {
  let created = 0, skipped = 0;
  for (const b of bottles) {
    const existing = await prisma.whiskey.findFirst({
      where: { name: { equals: b.name, mode: "insensitive" } },
    });
    if (existing) {
      console.log(`  SKIP  ${label}: "${b.name}"`);
      skipped++;
    } else {
      const row = await prisma.whiskey.create({
        data: {
          name: b.name,
          brand: b.brand,
          category: b.category,
          proof: b.proof,
          ...(b.ageYears != null && { ageYears: b.ageYears }),
          ...(b.distillery && { distillery: b.distillery }),
          ...(b.mashBill && { mashBill: b.mashBill }),
          description: b.description,
        },
        select: { id: true },
      });
      console.log(`  CREATE ${label}: "${b.name}" → ${row.id}`);
      created++;
    }
  }
  return { created, skipped };
}

async function main() {
  console.log(`Catalog seed — falling-tree production\n`);
  console.log(`Target DB: ${process.env.DATABASE_URL?.replace(/:[^@]+@/, ":***@")}\n`);

  // ── Zero-proof bottles ────────────────────────────────────────────────────
  const zpBottles = await seedBottles(ZERO_PROOF_BOTTLES, "ZP bottle");
  console.log(`\n✓ Zero-proof bottles: ${zpBottles.created} created, ${zpBottles.skipped} skipped`);

  // ── Extra bourbons ────────────────────────────────────────────────────────
  const extraBottles = await seedBottles(EXTRA_BOURBONS, "Extra bourbon");
  console.log(`✓ Extra bourbons:     ${extraBottles.created} created, ${extraBottles.skipped} skipped`);

  // ── Rick user ─────────────────────────────────────────────────────────────
  const rick = await prisma.user.findFirst({
    where: { handle: "rick" },
    select: { id: true, email: true },
  });
  if (!rick) throw new Error("Rick user not found (handle: rick).");
  console.log(`\nRick userId: ${rick.id} (${rick.email})`);

  // ── Zero-proof recipes ────────────────────────────────────────────────────
  let rCreated = 0, rSkipped = 0;
  for (const r of ZERO_PROOF_RECIPES) {
    const mapped = mapRecipe(r);
    const existing = await prisma.recipe.findFirst({
      where: { title: { equals: mapped.title, mode: "insensitive" }, userId: rick.id },
    });
    if (existing) {
      console.log(`  SKIP  recipe: "${mapped.title}"`);
      rSkipped++;
    } else {
      const row = await prisma.recipe.create({
        data: {
          userId: rick.id,
          title: mapped.title,
          description: mapped.description,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ingredients: mapped.ingredients as any,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          steps: mapped.steps as any,
          status: "APPROVED",
          isPublished: true,
          isAiGenerated: true,
        },
        select: { id: true },
      });
      console.log(`  CREATE recipe: "${mapped.title}" → ${row.id}`);
      rCreated++;
    }
  }
  console.log(`✓ Zero-proof recipes: ${rCreated} created, ${rSkipped} skipped`);

  // ── Final counts ──────────────────────────────────────────────────────────
  const [bottleCount, recipeCount] = await Promise.all([
    prisma.whiskey.count(),
    prisma.recipe.count({ where: { status: "APPROVED", isPublished: true } }),
  ]);
  console.log(`\n── Final state ────────────────────────────────`);
  console.log(`Bottles: ${bottleCount}`);
  console.log(`Published recipes: ${recipeCount}`);
  console.log(`\n✓ Catalog seed complete.`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
