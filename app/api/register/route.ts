import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { sendVerificationEmail } from "@/lib/email";

export async function POST(req: Request) {
  // Log DB target so Vercel function logs confirm which database is receiving writes
  const dbUrl = process.env.DATABASE_URL ?? "MISSING";
  const dbTarget = dbUrl === "MISSING" ? "MISSING" : dbUrl.split("@")[1]?.split("/")[0] ?? "unparseable";
  console.log(`[register] DB target: ${dbTarget}`);

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

  try {
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return NextResponse.json(
        { error: "An account with that email already exists." },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const baseHandle = name.toLowerCase().replace(/\s+/g, "").slice(0, 20);
    const random = Math.floor(Math.random() * 9000) + 1000;
    const handle = `${baseHandle}${random}`;

    const newUser = await prisma.user.create({
      data: {
        name,
        displayName: name,
        email: normalizedEmail,
        hashedPassword,
        handle,
      },
      select: { id: true },
    });

    console.log(`[register] User created: ${normalizedEmail}`);

    // Auto-follow Rick (fire-and-forget — don't block or fail signup)
    prisma.user.findUnique({ where: { handle: "rick" }, select: { id: true } })
      .then((rick) => {
        if (rick) {
          return prisma.follow.create({
            data: { followerId: newUser.id, followingId: rick.id },
          });
        }
      })
      .catch((err) => console.error("[register] Auto-follow Rick failed:", err));
  } catch (err) {
    console.error("[register] DB write failed:", err);
    return NextResponse.json(
      { error: "Something went wrong creating your account. Please try again." },
      { status: 500 }
    );
  }

  // Send verification email (fire-and-forget — don't block signup on email failure)
  try {
    const token = randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 1000 * 60 * 60 * 24);

    await prisma.verificationToken.create({
      data: {
        identifier: `email-verify:${normalizedEmail}`,
        token,
        expires,
      },
    });

    await sendVerificationEmail(normalizedEmail, token);
  } catch (err) {
    console.error("[register] Verification email failed to send:", err);
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
