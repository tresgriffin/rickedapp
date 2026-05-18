import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET /api/users?q=
// Searches by handle and displayName.
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const pageSize = Math.min(20, Math.max(1, parseInt(searchParams.get("pageSize") ?? "8", 10)));

  if (!q) {
    return NextResponse.json({ data: [], meta: { total: 0 } });
  }

  const users = await prisma.user.findMany({
    where: {
      OR: [
        { handle: { contains: q, mode: "insensitive" } },
        { displayName: { contains: q, mode: "insensitive" } },
      ],
    },
    take: pageSize,
    select: {
      id: true,
      handle: true,
      displayName: true,
      avatarUrl: true,
      _count: {
        select: {
          recipes: { where: { status: "APPROVED", isPublished: true } },
          reviews: { where: { status: "APPROVED" } },
          followers: true,
        },
      },
    },
  });

  return NextResponse.json({ data: users, meta: { total: users.length } });
}
