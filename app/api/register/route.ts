import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

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

  const existing = await prisma.user.findUnique({ where: { email } });
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
      email,
      hashedPassword,
      handle,
    },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
