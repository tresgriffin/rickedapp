import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });
  const dob = new Date("1985-01-01");
  const result = await prisma.user.updateMany({
    where: { email: { in: ["tres@ricked.app", "brian@ricked.app"] } },
    data: { dateOfBirth: dob, hasPickedHandle: true },
  });
  console.log("Backfilled", result.count, "demo users");
  await prisma.$disconnect();
}
main();
