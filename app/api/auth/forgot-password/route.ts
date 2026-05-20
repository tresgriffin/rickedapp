import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(req: Request) {
  const { email } = await req.json();

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
    select: { id: true, email: true },
  });

  // Always return 200 — don't reveal whether the email exists
  if (!user?.email) {
    return NextResponse.json({ ok: true });
  }

  // Delete any existing reset token for this email
  await prisma.passwordResetToken.deleteMany({ where: { email: user.email } });

  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

  await prisma.passwordResetToken.create({
    data: { email: user.email, token, expires },
  });

  try {
    await sendPasswordResetEmail(user.email, token);
  } catch {
    return NextResponse.json(
      { error: "Something went wrong sending the reset email. Please try again." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
