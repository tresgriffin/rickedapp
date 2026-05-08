import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { sendVerificationEmail } from "@/lib/email";

export async function POST(req: Request) {
  const { name, email, password } = await req.json();

  if (!name || !email || !password) {
    return NextResponse.json(
      { error: "Name, email, and password are required." },
      { status: 400 }
    );
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters." },
      { status: 400 }
    );
  }

  const normalizedEmail = email.toLowerCase().trim();

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    return NextResponse.json(
      { error: "An account with that email already exists." },
      { status: 409 }
    );
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  // Derive a unique handle from the name
  const baseHandle = name.toLowerCase().replace(/\s+/g, "").slice(0, 20);
  const random = Math.floor(Math.random() * 9000) + 1000;
  const handle = `${baseHandle}${random}`;

  await prisma.user.create({
    data: {
      name,
      displayName: name,
      email: normalizedEmail,
      hashedPassword,
      handle,
    },
  });

  // Send verification email (fire-and-forget — don't block signup on email failure)
  try {
    const token = randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24 hours

    await prisma.verificationToken.create({
      data: {
        identifier: `email-verify:${normalizedEmail}`,
        token,
        expires,
      },
    });

    await sendVerificationEmail(normalizedEmail, token);
  } catch (err) {
    // Log but don't fail the signup — user can resend from banner
    console.error("Verification email failed to send:", err);
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
