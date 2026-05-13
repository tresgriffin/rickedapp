import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/auth/verify-email-change?token=...
// Verifies the email change token, atomically swaps pendingEmail → email,
// then signs the user out (session has stale email — must re-login).
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/profile/edit?email_change=invalid", req.url));
  }

  const record = await prisma.verificationToken.findUnique({ where: { token } });

  if (!record || !record.identifier.startsWith("email-change:")) {
    return NextResponse.redirect(new URL("/profile/edit?email_change=invalid", req.url));
  }

  if (record.expires < new Date()) {
    await prisma.verificationToken.delete({ where: { token } });
    return NextResponse.redirect(new URL("/profile/edit?email_change=expired", req.url));
  }

  const userId = record.identifier.replace("email-change:", "");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { pendingEmail: true },
  });

  if (!user?.pendingEmail) {
    // Change was cancelled or already completed
    return NextResponse.redirect(new URL("/profile/edit?email_change=invalid", req.url));
  }

  const newEmail = user.pendingEmail;

  // Check the target email is still available (could have been claimed during pending window)
  const conflict = await prisma.user.findUnique({
    where: { email: newEmail },
    select: { id: true },
  });

  if (conflict && conflict.id !== userId) {
    await prisma.verificationToken.delete({ where: { token } });
    return NextResponse.redirect(new URL("/profile/edit?email_change=claimed", req.url));
  }

  // Atomically: swap email, clear pending fields, mark verified, delete token
  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: {
        email: newEmail,
        emailVerified: new Date(),
        pendingEmail: null,
        pendingEmailRequestedAt: null,
      },
    }),
    prisma.verificationToken.delete({ where: { token } }),
  ]);

  // Sign user out — their session has the old email encoded in the JWT
  return NextResponse.redirect(new URL("/login?email_changed=1", req.url));
}
