/**
 * Ricked seed script — demo data for development.
 *
 * Run: pnpm db:seed
 *
 * Idempotent: skips everything if whiskey data already exists.
 * Safe to re-run after wiping the DB.
 *
 * DEFER TO Phase 8a.4 (deploy): Disable or gate this seed for production.
 *   Demo accounts must not exist in the live environment.
 *   Run only against the dev/staging DB; never against production Neon.
 */

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

// ─── Demo user credentials ────────────────────────────────────────────────────
// PRODUCTION TODO: These demo users and their passwords must be
//   removed before going live. They exist solely for local dev and QA.
// Credentials rotated 2026-05-07 (Phase 8a.3). Plaintext stored in .env.local
// under the # DEMO ACCOUNTS section — never commit plaintext to git.
const DEMO_USERS = [
  {
    email: "tres@ricked.app",
    password: "GpRtKaD5Cl95NWU5", // rotated 2026-05-07 — plaintext in .env.local
    handle: "tres",
    displayName: "Tres",
    bio: "Builder of Ricked. Occasional Old Fashioned enthusiast.",
    isAdmin: true,  // unlimited Rick access for dev testing
  },
  {
    email: "brian@ricked.app",
    password: "3R3Veov3bvpHzVuj", // rotated 2026-05-07 — plaintext in .env.local
    handle: "brian",
    displayName: "Brian",
    bio: "Just trying to figure out what I actually like. No shame in that.",
    isAdmin: false, // non-admin preserves rate-limit testing locally
  },
] as const;

// ─── 15 whiskeys ─────────────────────────────────────────────────────────────
// DEFER TO Phase 8b (content sprint): Replace imageUrl placeholders with licensed
//   product photos. Placeholder SVG ships with closed beta — acceptable for QA.
//   Source: official brand press kits or licensed stock. See /public/images/bottle-placeholder.svg.
const WHISKEYS = [
  {
    name: "Buffalo Trace",
    brand: "Buffalo Trace Distillery",
    category: "BOURBON" as const,
    distillery: "Buffalo Trace Distillery, Frankfort, KY",
    mashBill: "~10% rye (Mash Bill #1) — exact recipe not disclosed",
    proof: 90,
    ageYears: null,
    description:
      "The flagship of Buffalo Trace Distillery, and for many people the bottle that gets them hooked on bourbon in the first place. It's aged in new charred oak barrels — how long exactly, they won't say — and comes out tasting like everything you want bourbon to be: vanilla, caramel, a little fruit, a light hint of oak. Not too sweet, not too boozy. At the price it usually sells for, it's almost unfairly good. If you see it on a shelf, grab it.",
  },
  {
    name: "Woodford Reserve",
    brand: "Woodford Reserve Distillery",
    category: "BOURBON" as const,
    distillery: "Woodford Reserve Distillery, Versailles, KY",
    mashBill: "72% corn, 18% rye, 10% malted barley",
    proof: 90.4,
    ageYears: 7,
    description:
      "One of the most recognizable bottles in the bourbon world, and for good reason. Woodford Reserve is made at a beautiful historic distillery in Versailles, Kentucky, and it shows in the glass — this is a polished, well-balanced bourbon with notes of dried fruit, toasted oak, and a little baking spice on the finish. The higher rye content gives it more complexity than many mainstream bourbons. It's the kind of bottle you can confidently bring to any dinner party without overthinking it.",
  },
  {
    name: "Maker's Mark",
    brand: "Maker's Mark Distillery",
    category: "BOURBON" as const,
    distillery: "Star Hill Farm Distillery, Loretto, KY",
    mashBill: "70% corn, 16% red winter wheat, 14% malted barley",
    proof: 90,
    ageYears: 6,
    description:
      "Maker's Mark is what's called a wheated bourbon — instead of rye, it uses red winter wheat as the secondary grain, which makes the whole thing softer and sweeter. No sharp edges. No big rye spice. Just warm caramel, vanilla, and a gentle, slightly fruity finish. That red wax seal isn't just for show — this bottle has been consistent for decades, which in the bourbon world is actually rare. Great starting point if you're new to all this, and still a solid pour when you're not.",
  },
  {
    name: "Wild Turkey 101",
    brand: "Wild Turkey Distillery",
    category: "BOURBON" as const,
    distillery: "Wild Turkey Distillery, Lawrenceburg, KY",
    mashBill: "75% corn, 13% rye, 12% malted barley",
    proof: 101,
    ageYears: null,
    description:
      "Wild Turkey 101 is one of those bottles that's been sitting at the same proof and roughly the same price for decades, quietly being excellent while other brands chase trends. At 101 proof there's real heat here, but it's the kind of heat that brings flavor with it — bold vanilla, caramel, and a rye spice finish that actually stays with you. Master Distiller Eddie Russell has been making this for years and it shows. No water needed (though a single cube doesn't hurt). Old-school in the best way.",
  },
  {
    name: "Knob Creek 9 Year",
    brand: "Jim Beam",
    category: "BOURBON" as const,
    distillery: "Jim Beam Distillery, Clermont, KY",
    mashBill: "75% corn, 13% rye, 12% malted barley",
    proof: 100,
    ageYears: 9,
    description:
      "Knob Creek is the heavy one in Beam's premium lineup — 9 years old, 100 proof, and it carries itself accordingly. The long aging shows up as rich, dark fruit and toasted oak that go beyond what you get from younger bourbons. There's toffee in there too, and a dry, slightly tannic finish that makes it feel substantial. It's a big bourbon that rewards a little patience. Pour it neat, let it sit for a minute, and you'll get more out of it than if you just slam it. Worth the extra few bucks over the standard shelf bourbons.",
  },
  {
    name: "Eagle Rare 10 Year",
    brand: "Buffalo Trace Distillery",
    category: "BOURBON" as const,
    distillery: "Buffalo Trace Distillery, Frankfort, KY",
    mashBill: "~10% rye (Mash Bill #1) — exact recipe not disclosed",
    proof: 90,
    ageYears: 10,
    description:
      "Eagle Rare is Buffalo Trace's 10-year single barrel, and the extra age makes a noticeable difference over the regular Buffalo Trace. The oak presence is real — tannins, a little leather, dried fruit — but it's balanced by vanilla and honey that keep it from going too dry. At 90 proof it's approachable even with all that age. The catch: it's almost impossible to find at MSRP. If you see it on a shelf for under $40, buy it immediately. If you only see it for $80+ at a bar, it's still probably worth ordering once.",
  },
  {
    name: "Four Roses Single Barrel",
    brand: "Four Roses Distillery",
    category: "BOURBON" as const,
    distillery: "Four Roses Distillery, Lawrenceburg, KY",
    mashBill: "60% corn, 35% rye, 5% malted barley (OBSV recipe)",
    proof: 100,
    ageYears: null,
    description:
      "Four Roses is one of the more interesting stories in bourbon — they actually use 10 different recipes (2 mash bills × 5 yeast strains) and blend or single-barrel from them. The Single Barrel release is typically their OBSV recipe: the high-rye mash bill with a spicy yeast strain, which gives you big fruit and floral notes alongside that rye kick. Each barrel is different, so your bottle might vary from someone else's, which is part of the fun. At 100 proof it has presence without being overwhelming.",
  },
  {
    name: "Bulleit Bourbon",
    brand: "Bulleit Distilling Co.",
    category: "BOURBON" as const,
    distillery: "Bulleit Distilling Co., Shelbyville, KY",
    mashBill: "68% corn, 28% rye, 4% malted barley",
    proof: 90,
    ageYears: null,
    description:
      "Bulleit has one of the highest rye contents of any mainstream bourbon — that 28% rye mash bill is almost in rye whiskey territory, which gives it a noticeably spicy, dry character that stands out next to sweeter bourbons. The flavor profile leans toward baking spice, dried orange peel, and a long dry finish. It's also dead easy to find and consistently priced. Bartenders love it for cocktails because that spice cuts through ice and mixers without disappearing. A bottle worth having around.",
  },
  {
    name: "Old Forester 1920 Prohibition Style",
    brand: "Brown-Forman",
    category: "BOURBON" as const,
    distillery: "Old Forester Distilling Co., Louisville, KY",
    mashBill: "72% corn, 18% rye, 10% malted barley",
    proof: 115,
    ageYears: null,
    description:
      "Old Forester 1920 is the bold sibling in the Old Forester lineup, bottled at 115 proof to mimic the proof level the distillery reportedly used during Prohibition when selling for 'medicinal purposes.' That extra proof means you get more of everything — the vanilla and caramel are richer, the dark fruit is more intense, and the finish goes on longer. It has the kind of weight that makes you actually think about what you're drinking. Add a little water or one big ice cube and it opens up beautifully.",
  },
  {
    name: "Elijah Craig Small Batch",
    brand: "Heaven Hill Distilleries",
    category: "BOURBON" as const,
    distillery: "Heaven Hill Distilleries, Bardstown, KY",
    mashBill: "78% corn, 10% rye, 12% malted barley",
    proof: 94,
    ageYears: null,
    description:
      "Elijah Craig Small Batch is one of those bottles that appears on practically every 'best value bourbon' list, and the lists are right. Heaven Hill ages this for somewhere around 10–12 years, and that extra time in the barrel comes through as dark caramel, dried fruit, and a toasted oak note that adds real depth without tasting bitter. At 94 proof it's approachable, and at the price it usually sells for, it's one of the best bang-for-your-buck bottles you can find. A great everyday bourbon that never gets boring.",
  },
  {
    name: "Henry McKenna 10 Year Single Barrel",
    brand: "Heaven Hill Distilleries",
    category: "BOURBON" as const,
    distillery: "Heaven Hill Distilleries, Bardstown, KY",
    mashBill: "75% corn, 13% rye, 12% malted barley",
    proof: 100,
    ageYears: 10,
    description:
      "Henry McKenna 10 Year is a Bottled-in-Bond single barrel, which is a legal designation that means a lot: it's from one distillery, one distillation season, one barrel, and it's at least 4 years old and bottled at exactly 100 proof. McKenna hits all those marks and then some — it's 10 years old, which is rare for a BIB at this price. Expect rich vanilla, caramel, and a solid rye backbone with some dried fruit on the way out. Won a bunch of awards a few years back and still hasn't fully recovered its shelf presence. Worth seeking out.",
  },
  {
    name: "Russell's Reserve 10 Year",
    brand: "Wild Turkey Distillery",
    category: "BOURBON" as const,
    distillery: "Wild Turkey Distillery, Lawrenceburg, KY",
    mashBill: "75% corn, 13% rye, 12% malted barley",
    proof: 90,
    ageYears: 10,
    description:
      "Russell's Reserve 10 Year is what happens when Wild Turkey's Master Distillers (Jimmy and Eddie Russell) have 10 years and decide to dial the proof back to 90 instead of the 101 you get in the flagship. The lower proof makes it gentler and more approachable, while the extra aging adds layers — honey, baking spice, soft wood tannins, a little citrus. It's not trying to be bold; it's trying to be balanced, and it succeeds. A great option when you want something thoughtful rather than something that announces itself.",
  },
  {
    name: "Blanton's Original Single Barrel",
    brand: "Buffalo Trace Distillery",
    category: "BOURBON" as const,
    distillery: "Buffalo Trace Distillery, Frankfort, KY",
    mashBill: "~12-15% rye (Mash Bill #2) — exact recipe not disclosed",
    proof: 93,
    ageYears: null,
    description:
      "Blanton's was the first commercial single barrel bourbon, released in 1984, and the bottle alone — that round, distinctive shape with the stopper shaped like a horse and jockey — has made it one of the most recognizable spirits in the world. The whiskey inside uses Buffalo Trace's higher-rye Mash Bill #2, which gives it a little more spice than the regular Buffalo Trace. Caramel, citrus, and toasted oak are the main players. The reality: it's genuinely good, but the bottle is now worth more than the whiskey to many collectors, which has made it nearly impossible to find at MSRP.",
  },
  {
    name: "Weller Special Reserve",
    brand: "Buffalo Trace Distillery",
    category: "BOURBON" as const,
    distillery: "Buffalo Trace Distillery, Frankfort, KY",
    mashBill: "~0% rye — wheat as secondary grain (exact recipe not disclosed)",
    proof: 90,
    ageYears: null,
    description:
      "Weller Special Reserve is a wheated bourbon from Buffalo Trace — the same distillery that makes Pappy Van Winkle, and reportedly using a similar wheat-forward mash bill. That connection has made it one of the most hunted bottles in bourbon. The actual whiskey? Soft, sweet, and approachable. Honey, vanilla, caramel, light fruit. It's not complex, but it's pleasant and easy to drink. At MSRP it's a solid everyday pour. At the $80–150 secondary market price some retailers charge? You're mostly paying for the label.",
  },
  {
    name: "Basil Hayden",
    brand: "Beam Suntory",
    category: "BOURBON" as const,
    distillery: "Jim Beam Distillery, Clermont, KY",
    mashBill: "63% corn, 27% rye, 10% malted barley",
    proof: 80,
    ageYears: null,
    description:
      "Basil Hayden is the gentlest bottle in Beam's small-batch collection, and that's very much the point. At 80 proof — the legal minimum for bourbon — it's one of the lowest-proof options on the market, which makes it an excellent place to start if you're new to drinking whiskey neat. The high-rye mash bill gives it a dry, peppery character that keeps it interesting, but the lower alcohol means it won't burn or overwhelm. Spiced tea, light citrus, and a clean finish. If Brian is the target user of this app, this is the bottle you hand Brian first.",
  },
  {
    name: "The Macallan 12 Double Cask",
    brand: "The Macallan",
    category: "SCOTCH" as const,
    distillery: "The Macallan Distillery, Craigellachie, Speyside, Scotland",
    mashBill: "100% malted barley",
    proof: 86,
    ageYears: 12,
    description:
      "The Macallan 12 Double Cask is one of the most approachable entry points into Scotch whisky — matured in a combination of sherry-seasoned American and European oak casks, which gives it a rich, rounded sweetness that doesn't feel heavy. Dried fruit, vanilla, toffee, a hint of ginger and orange. No peat, no smoke — this is the Scotch you drink when someone says they don't like Scotch. The double-cask approach produces a more consistent, mellow result than the single-cask version, and it shows. A genuinely nice whisky to have around.",
  },
  {
    name: "Hibiki Harmony",
    brand: "Suntory Whisky",
    category: "JAPANESE" as const,
    distillery: "Yamazaki, Hakushu, and Chita distilleries (blended by Suntory)",
    mashBill: "Blend of single malts and grain whiskies — exact composition not disclosed",
    proof: 86,
    ageYears: null,
    description:
      "Hibiki Harmony is the no-age-statement expression from Suntory's flagship blend, and it's one of the most elegant whiskies made anywhere. Suntory blends malt from Yamazaki and Hakushu with lighter grain whisky from Chita and then finishes the blend in five different cask types — the result is something almost impossibly smooth, with honey, rose water, a whisper of orange peel, and a finish that seems to just quietly fade rather than end. Japanese whisky in general tends to be more delicate and layered than American bourbon; Hibiki Harmony is the clearest example of why that style is worth exploring.",
  },
  {
    name: "Jefferson's Reserve Very Small Batch",
    brand: "Jefferson's Bourbon",
    category: "BOURBON" as const,
    distillery: "Various distilleries (blended by Jefferson's)",
    mashBill: "~80% corn, 7% rye, 7% malted barley, 6% wheat",
    proof: 90.2,
    ageYears: null,
    description:
      "Jefferson's Reserve is interesting because it's a blend — Jefferson's sources whiskey from multiple distilleries and ages, then blends them to a consistent flavor profile. The result is something that doesn't taste like any single distillery's house style, with layers of dried fruit, vanilla, toasted oak, and a gentle grain sweetness. The 'very small batch' on the label means each batch is different, though the house flavor stays consistent. It's a little more expensive than comparable bottles but rewards anyone who wants something that's harder to place.",
  },
] as const;

// ─── Main seed function ───────────────────────────────────────────────────────
async function main() {
  // Idempotency check — skip if whiskey data already exists
  const existingWhiskey = await prisma.whiskey.findFirst();
  if (existingWhiskey) {
    console.log("✓ Demo data already exists — skipping seed.");
    return;
  }

  console.log("Seeding demo data…");

  // ── 1. Users ────────────────────────────────────────────────────────────────
  console.log("  Creating demo users…");
  const createdUsers: Array<{ id: string; handle: string }> = [];

  for (const u of DEMO_USERS) {
    const hashedPassword = await bcrypt.hash(u.password, 12);
    // Upsert so re-seeding after the rename migration doesn't fail on existing users
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { isAdmin: u.isAdmin },
      create: {
        email: u.email,
        name: u.displayName,
        displayName: u.displayName,
        handle: u.handle,
        bio: u.bio,
        hashedPassword,
        isAdmin: u.isAdmin,
        // Demo users skip onboarding so the feed is reachable immediately in dev
        hasSeenRickOnboarding: true,
      },
    });
    createdUsers.push({ id: user.id, handle: user.handle! });
    console.log(`    ✓ @${user.handle} (${user.email})`);
  }

  const [tresUser, brianUser] = createdUsers;

  // ── 2. Whiskeys ─────────────────────────────────────────────────────────────
  console.log("  Creating 18 whiskeys…");
  const createdWhiskeys: Array<{ id: string; name: string }> = [];

  for (const w of WHISKEYS) {
    const whiskey = await prisma.whiskey.create({
      data: {
        name: w.name,
        brand: w.brand,
        category: w.category,
        distillery: w.distillery,
        mashBill: w.mashBill,
        proof: w.proof,
        ageYears: w.ageYears ?? null,
        description: w.description,
        // imageUrl defaults to /images/bottle-placeholder.svg
      },
    });
    createdWhiskeys.push({ id: whiskey.id, name: whiskey.name });
  }
  console.log(`    ✓ ${createdWhiskeys.length} whiskeys created`);

  // ── 3. Reviews ──────────────────────────────────────────────────────────────
  console.log("  Creating reviews…");

  const reviews = [
    // Tres's reviews
    {
      userId: tresUser.id,
      whiskeyName: "Buffalo Trace",
      rating: 5,
      body: "My go-to. Every time I open a new bottle of Buffalo Trace I wonder if I've been overthinking the whole thing — why mess around when this exists? Consistently smooth, vanilla-forward, and just the right amount of oak. The fact that it's this affordable is the real mystery of the bourbon world.",
    },
    {
      userId: tresUser.id,
      whiskeyName: "Knob Creek 9 Year",
      rating: 4,
      body: "Big and bold in a way that makes you pay attention. The 9 years really shows — there's dark fruit and a kind of chewy richness that younger bourbons don't have. Sometimes I want something lighter, but when I'm in the mood for something substantial, this is where I land.",
    },
    {
      userId: tresUser.id,
      whiskeyName: "Old Forester 1920 Prohibition Style",
      rating: 5,
      body: "Don't let 115 proof scare you. Add the tiniest splash of water and this thing absolutely opens up — the vanilla gets richer, the dark fruit gets more complex, and the finish goes on for what feels like a minute. One of the best bottles in the under-$60 range by a significant margin.",
    },
    {
      userId: tresUser.id,
      whiskeyName: "Blanton's Original Single Barrel",
      rating: 4,
      body: "Look, the bottle is great and the whiskey is genuinely good. I just don't love how hard it is to find at a fair price. When I can get it at MSRP it's a solid 4-star pour. When I see it marked up to $120 at a bar, I order something else out of spite.",
    },
    // Brian's reviews
    {
      userId: brianUser.id,
      whiskeyName: "Maker's Mark",
      rating: 4,
      body: "This was the first bourbon I tried that didn't make me want to add Coke to it. Super smooth, nothing sharp, kind of caramel-y and sweet but not like candy. My friend handed me one neat and said 'just try it' and I finally got what the big deal is. Starting here was the right call.",
    },
    {
      userId: brianUser.id,
      whiskeyName: "Bulleit Bourbon",
      rating: 4,
      body: "I ordered this in an Old Fashioned at a nice bar and loved it so much I just started buying it at home. It's got this spicy kick that I didn't expect — not hot spicy, more like black pepper and orange peel. My cocktail game has genuinely improved since I started using this instead of whatever was on sale.",
    },
    {
      userId: brianUser.id,
      whiskeyName: "Wild Turkey 101",
      rating: 3,
      body: "This is definitely the biggest bourbon I've tried so far and I'm not 100% sure I'm ready for it yet. A little water makes it way more approachable. I can see why people love it — there's a lot going on — but right now I feel like I'm missing half the flavors because I'm not used to something this strong. Revisiting in a few months.",
    },
    {
      userId: brianUser.id,
      whiskeyName: "Woodford Reserve",
      rating: 5,
      body: "Brought this to a dinner party and felt like a competent adult for the first time in my bourbon journey. Everyone loved it. I loved it. The dried fruit thing everyone talks about? I actually tasted it this time. Smooth enough to drink neat but interesting enough that you actually want to keep drinking it. This is my bottle for when it matters.",
    },
  ];

  for (const r of reviews) {
    const whiskey = createdWhiskeys.find((w) => w.name === r.whiskeyName);
    if (!whiskey) continue;
    await prisma.review.create({
      data: {
        userId: r.userId,
        whiskeyId: whiskey.id,
        rating: r.rating,
        body: r.body,
        status: "APPROVED",
      },
    });
  }
  console.log(`    ✓ ${reviews.length} reviews created`);

  // ── 4. Posts ────────────────────────────────────────────────────────────────
  console.log("  Creating posts…");

  const find = (name: string) => createdWhiskeys.find((w) => w.name === name)?.id ?? null;

  const posts = [
    {
      userId: tresUser.id,
      body: "Buffalo Trace > everything. There, I said it. Fight me in the comments.",
      taggedWhiskeyId: find("Buffalo Trace"),
    },
    {
      userId: tresUser.id,
      body: "Weller Special Reserve is good. Weller Special Reserve at secondary market prices is a different bottle entirely, and that bottle is not worth it. Stop paying $90 for a $25 whiskey. (Love it at MSRP though, genuinely.)",
      taggedWhiskeyId: find("Weller Special Reserve"),
    },
    {
      userId: brianUser.id,
      body: "Made my first Old Fashioned from scratch last night — muddled cherry, actual orange peel, Elijah Craig, one big ice cube. My bar cart has officially graduated from 'sad corner' to 'intentional.' Big moment for me.",
      taggedWhiskeyId: find("Elijah Craig Small Batch"),
    },
    {
      userId: brianUser.id,
      body: "Ordered Bulleit at a bar last week and the bartender gave me an approving nod. I have no idea if that means anything but it felt good. Slowly figuring out what I like. This whole hobby is way less intimidating than I thought.",
      taggedWhiskeyId: find("Bulleit Bourbon"),
    },
  ];

  for (const p of posts) {
    await prisma.post.create({
      data: {
        userId: p.userId,
        body: p.body,
        taggedWhiskeyId: p.taggedWhiskeyId,
        status: "APPROVED",
      },
    });
  }
  console.log(`    ✓ ${posts.length} posts created`);

  // ── 5. Recipes ──────────────────────────────────────────────────────────────
  console.log("  Creating recipes…");

  await prisma.recipe.create({
    data: {
      userId: tresUser.id,
      title: "Classic Old Fashioned",
      taggedWhiskeyId: find("Knob Creek 9 Year"),
      description:
        "The original cocktail — bourbon, bitters, a little sugar, a big piece of orange peel. Nothing else. Don't let anyone put muddled fruit in yours.",
      ingredients: [
        { amount: "2 oz", item: "Bourbon (Knob Creek or Elijah Craig work great)" },
        { amount: "1 tsp", item: "Simple syrup (or 1 sugar cube)" },
        { amount: "2 dashes", item: "Angostura bitters" },
        { amount: "1 dash", item: "Orange bitters (optional but recommended)" },
        { amount: "1 large", item: "Ice cube" },
        { amount: "1 strip", item: "Orange peel, for garnish" },
      ],
      steps: [
        "Add the simple syrup (or muddle the sugar cube with a splash of water) and both bitters to a rocks glass.",
        "Add the bourbon.",
        "Add a large ice cube. Stir gently for 20–30 seconds — you're chilling and diluting, not shaking.",
        "Express the orange peel over the glass (squeeze and twist the peel so the oils spritz across the surface), then run it around the rim and drop it in.",
        "Drink it. That's it.",
      ],
      status: "APPROVED",
    },
  });

  await prisma.recipe.create({
    data: {
      userId: brianUser.id,
      title: "Whiskey Sour",
      taggedWhiskeyId: find("Bulleit Bourbon"),
      description:
        "Tart, a little sweet, and actually really refreshing. Adding an egg white makes it silky and gives you that foam on top — it sounds weird but trust the process.",
      ingredients: [
        { amount: "2 oz", item: "Bourbon (Bulleit is great here — the spice works well)" },
        { amount: "3/4 oz", item: "Fresh lemon juice (please, fresh — bottled juice ruins it)" },
        { amount: "3/4 oz", item: "Simple syrup" },
        { amount: "1", item: "Egg white (optional but recommended)" },
        { amount: "2 dashes", item: "Angostura bitters (for garnish)" },
        { amount: "1", item: "Lemon wheel or cherry, for garnish" },
      ],
      steps: [
        "If using egg white: combine bourbon, lemon juice, simple syrup, and egg white in a shaker. Dry shake (no ice) for 15 seconds to emulsify the egg white.",
        "Add ice and shake hard for another 10–15 seconds.",
        "If skipping the egg white: just add everything to a shaker with ice and shake well.",
        "Strain into a rocks glass over ice (or a coupe glass for a fancy version).",
        "Garnish with a few drops of bitters on the foam and a lemon wheel or cherry.",
        "The egg white foam is edible. You're not going to get sick. It's fine. Try it.",
      ],
      status: "APPROVED",
    },
  });

  console.log("    ✓ 2 recipes created");

  console.log("\n✓ Seed complete.");
  console.log("  Demo credentials:");
  console.log("    @tres  — tres@ricked.app  / (see .env.local # DEMO ACCOUNTS)");
  console.log("    @brian — brian@ricked.app / (see .env.local # DEMO ACCOUNTS)");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
