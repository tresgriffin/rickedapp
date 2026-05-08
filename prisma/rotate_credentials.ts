import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";

// Rotated 2026-05-07 (Phase 8a.3). Plaintext in .env.local # DEMO ACCOUNTS.
const UPDATES = [
  {
    email: "tres@ricked.app",
    hashedPassword: "$2b$12$r2ay7HsprLRIkn/NkNzoC.U/Ls43cXSM8BNs0bGWn9qEwUvCMu9.6",
  },
  {
    email: "brian@ricked.app",
    hashedPassword: "$2b$12$m4n7v0nyDRswGqG4QXx7vekoz20IoRbabdzFYtY51LQV8I2Kz6TLq",
  },
];

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });

  for (const { email, hashedPassword } of UPDATES) {
    const result = await prisma.user.updateMany({
      where: { email },
      data: { hashedPassword },
    });
    console.log(`Updated ${result.count} record(s) for ${email}`);
  }

  await prisma.$disconnect();
  console.log("Credential rotation complete.");
}
main();
