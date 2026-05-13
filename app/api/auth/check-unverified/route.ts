import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/auth/check-unverified?email=...
// Returns { needsVerification: boolean } — always 200, never reveals user existence.
// Used by login page to decide whether to show the resend-verification affordance.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email")?.toLowerCase().trim() ?? "";

  if (!email) {
    return NextResponse.json({ needsVerification: false });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { emailVerified: true },
  });

  const needsVerification = !!user && !user.emailVerified;
  return NextResponse.json({ needsVerification });
}
