import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { validateHandleFormat } from "@/lib/actions/onboarding";

// GET /api/check-handle?handle=...
// Returns { available: boolean, error?: string, suggestions?: string[] }
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const raw = (searchParams.get("handle") ?? "").trim().toLowerCase();

  const formatError = validateHandleFormat(raw);
  if (formatError) {
    return NextResponse.json({ available: false, error: formatError });
  }

  const existing = await prisma.user.findFirst({
    where: {
      handle: { equals: raw, mode: "insensitive" },
      NOT: { id: session.user.id },
    },
    select: { id: true },
  });

  if (!existing) {
    return NextResponse.json({ available: true });
  }

  // Generate 2-3 suggestions based on the requested handle
  const suggestions = await generateSuggestions(raw, session.user.id);
  return NextResponse.json({ available: false, error: "That handle is taken.", suggestions });
}

async function generateSuggestions(base: string, userId: string): Promise<string[]> {
  // Three numeric variants — all valid handles, no trailing underscores
  const r1 = Math.floor(Math.random() * 90) + 10;
  const r2 = Math.floor(Math.random() * 90) + 10;
  const year = new Date().getFullYear().toString().slice(-2);
  const candidates = [
    `${base}${r1}`,
    `${base}${year}`,
    `${base}${r2 === r1 ? r2 + 1 : r2}`, // ensure r1 ≠ r2
  ].filter((c) => c.length <= 20 && c.length >= 3);

  const taken = await prisma.user.findMany({
    where: {
      handle: { in: candidates, mode: "insensitive" },
      NOT: { id: userId },
    },
    select: { handle: true },
  });

  const takenSet = new Set(taken.map((u) => u.handle?.toLowerCase()));
  return candidates.filter((c) => !takenSet.has(c.toLowerCase())).slice(0, 3);
}
