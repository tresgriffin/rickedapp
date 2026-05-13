import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/db";
import { sendVerificationEmail } from "@/lib/email";

// POST /api/auth/resend-verification-public
// Body: { email: string }
// Unauthenticated — used from login page where no session exists.
// Always returns 200 to prevent email enumeration.
export async function POST(req: Request) {
  const { email } = await req.json().catch(() => ({}));

  if (!email || typeof email !== "string") {
    return NextResponse.json({ ok: true }); // silently ignore bad input
  }

  const normalizedEmail = email.toLowerCase().trim();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { email: true, emailVerified: true },
  });

  // Only send if user exists and is unverified — but always return 200
  if (user?.email && !user.emailVerified) {
    try {
      await prisma.verificationToken.deleteMany({
        where: { identifier: `email-verify:${normalizedEmail}` },
      });

      const token = randomBytes(32).toString("hex");
      const expires = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24 hours

      await prisma.verificationToken.create({
        data: { identifier: `email-verify:${normalizedEmail}`, token, expires },
      });

      await sendVerificationEmail(normalizedEmail, token);
    } catch {
      // Log internally but don't reveal failure to caller
      console.error("[resend-verification-public] Failed to send:", normalizedEmail);
    }
  }

  return NextResponse.json({ ok: true });
}
