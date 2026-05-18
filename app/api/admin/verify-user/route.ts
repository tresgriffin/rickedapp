import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// POST /api/admin/verify-user
// Body: { email: string }
// Header: Authorization: Bearer <ADMIN_SECRET>
//
// Manually sets emailVerified = now() for a given email.
// Beta hygiene — recovery path when verification emails don't land.
//
// Usage (curl):
//   curl -X POST https://ricked.app/api/admin/verify-user \
//     -H "Authorization: Bearer <ADMIN_SECRET>" \
//     -H "Content-Type: application/json" \
//     -d '{"email":"user@example.com"}'
//
// FUTURE: replace with a proper admin dashboard in Phase 9.
export async function POST(req: Request) {
  const secret = process.env.ADMIN_SECRET;

  if (!secret) {
    return NextResponse.json({ error: "Admin endpoint not configured." }, { status: 503 });
  }

  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";

  if (token !== secret) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { email } = await req.json().catch(() => ({}));

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "email is required." }, { status: 400 });
  }

  const normalizedEmail = email.toLowerCase().trim();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true, emailVerified: true },
  });

  if (!user) {
    return NextResponse.json({ error: `No user found for ${normalizedEmail}.` }, { status: 404 });
  }

  if (user.emailVerified) {
    return NextResponse.json({
      ok: true,
      message: `${normalizedEmail} was already verified (${user.emailVerified.toISOString()}).`,
      alreadyVerified: true,
    });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: new Date() },
  });

  return NextResponse.json({
    ok: true,
    message: `${normalizedEmail} is now verified.`,
    alreadyVerified: false,
  });
}
