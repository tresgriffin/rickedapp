/**
 * Seeds Rick's 7 intro feed posts into production (ep-falling-tree).
 * Idempotent: skips any post whose body already exists for Rick.
 *
 * Run: DATABASE_URL="<falling-tree-url>" ./node_modules/.bin/tsx prisma/seed.rick-posts.ts
 */

import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: { rejectUnauthorized: false },
});
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const LAGAVULIN_ID = "cmp1n7src0012cup3gzae617j";

// Timestamps staggered over 6 days, varying times of day for a natural look.
// Post 1 is newest (top of feed), Post 7 is oldest (bottom).
const POSTS = [
  {
    body: "I'm Rick. I'll be around here talking whiskey, cocktails, and the occasional strong opinion about ice. I'm the resident mixologist here, which means I know my way around a glass and I'm happy to share what I know without making you feel dumb for asking. No pretension, no gatekeeping. If you've got a bottle and a question, come find me in chat!",
    mediaUrl: "/ricked-assets/rick-intro-post.png",
    taggedWhiskeyId: null,
    createdAt: new Date("2026-05-31T09:15:00.000Z"),
  },
  {
    body: "Warm night, porch weather, a Highball does more work than it has any right to. Two parts whisky, the rest cold soda, a slice of lemon. Don't overthink it.",
    mediaUrl: null,
    taggedWhiskeyId: null,
    createdAt: new Date("2026-05-30T14:47:00.000Z"),
  },
  {
    body: "Living the zero-proof life? We've got plenty here for you. There are zero-proof bottles in our library and a few cocktails built around them. A zero-proof Old Fashioned is a real drink, not a sad substitute. Same ritual, same glass, none of the proof. Ask me in chat if you want a pour that fits.",
    mediaUrl: null,
    taggedWhiskeyId: null,
    createdAt: new Date("2026-05-29T11:22:00.000Z"),
  },
  {
    body: "Citrus peel goes oils-down, expressed over the glass first. The oils are the point. The peel is just the delivery system. If you've been dropping yours in flesh-up the whole time, no judgment. Ask me in chat if you want the longer version.",
    mediaUrl: null,
    taggedWhiskeyId: null,
    createdAt: new Date("2026-05-28T19:05:00.000Z"),
  },
  {
    body: "Bourbon vs. rye is the wrong fight. The fight that matters is wheat vs. rye in the mash bill. One makes a soft pour, the other makes a sharp one. Chat me if you want to get into it.",
    mediaUrl: null,
    taggedWhiskeyId: null,
    createdAt: new Date("2026-05-27T15:33:00.000Z"),
  },
  {
    body: "If your Old Fashioned tastes like sugar water, you're using too much. A quarter ounce of simple. Two dashes of bitters. The bourbon does the talking.",
    mediaUrl: null,
    taggedWhiskeyId: null,
    createdAt: new Date("2026-05-26T10:18:00.000Z"),
  },
  {
    body: "Lagavulin 16 doesn't always need a cocktail. Sometimes just a splash of water, an evening, and time to sit with it. I'm around if you want to talk peat.",
    mediaUrl: null,
    taggedWhiskeyId: LAGAVULIN_ID,
    createdAt: new Date("2026-05-25T20:52:00.000Z"),
  },
];

async function main() {
  console.log("Rick posts seed — falling-tree production\n");

  const rick = await prisma.user.findFirst({
    where: { handle: "rick" },
    select: { id: true, email: true },
  });
  if (!rick) throw new Error("Rick user not found (handle: rick).");
  console.log(`Rick: ${rick.id} (${rick.email})\n`);

  let created = 0;
  let skipped = 0;

  for (const [i, post] of POSTS.entries()) {
    const existing = await prisma.post.findFirst({
      where: { userId: rick.id, body: post.body },
    });

    if (existing) {
      console.log(`  SKIP  post ${i + 1}: already exists (${existing.id})`);
      skipped++;
      continue;
    }

    const row = await prisma.post.create({
      data: {
        userId: rick.id,
        body: post.body,
        mediaUrl: post.mediaUrl,
        taggedWhiskeyId: post.taggedWhiskeyId,
        status: "APPROVED",
        createdAt: post.createdAt,
      },
      select: { id: true, createdAt: true },
    });

    const label = i === 0 ? " [intro + image]"
      : i === 6 ? " [Lagavulin tagged]"
      : "";
    console.log(`  CREATE post ${i + 1}${label}: ${row.id} @ ${row.createdAt.toISOString()}`);
    created++;
  }

  const total = await prisma.post.count({ where: { userId: rick.id } });
  console.log(`\n✓ Posts: ${created} created, ${skipped} skipped`);
  console.log(`✓ Rick's total posts: ${total}`);
  console.log("\n✓ Seed complete.");

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
