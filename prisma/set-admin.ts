/**
 * Grants admin status to a user by email address.
 * Idempotent — safe to re-run if already admin.
 *
 * Usage:
 *   DATABASE_URL="postgresql://..." npx tsx prisma/set-admin.ts user@example.com
 */

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";

const email = process.argv[2]?.trim().toLowerCase();

if (!email) {
  console.error('Usage: DATABASE_URL="postgresql://..." npx tsx prisma/set-admin.ts user@example.com');
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, handle: true, isAdmin: true },
  });

  if (!user) {
    console.error(`No user found for ${email}`);
    process.exit(1);
  }

  if (user.isAdmin) {
    console.log(`${email} (@${user.handle ?? "no handle"}) is already an admin. Nothing to do.`);
    return;
  }

  await prisma.user.update({
    where: { email },
    data: { isAdmin: true },
  });

  console.log(`✓ ${email} (@${user.handle ?? "no handle"}) is now an admin.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
