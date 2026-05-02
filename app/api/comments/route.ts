import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { LikeTargetType } from "@/app/generated/prisma/client";

// GET /api/comments?targetType=POST|REVIEW|RECIPE&targetId=&offset=0
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const targetType = searchParams.get("targetType") as LikeTargetType | null;
  const targetId = searchParams.get("targetId") ?? "";
  const offset = Math.max(0, parseInt(searchParams.get("offset") ?? "0", 10));
  const limit = 10;

  if (!targetType || !targetId) {
    return NextResponse.json(
      { error: "targetType and targetId are required." },
      { status: 400 }
    );
  }

  const [comments, total] = await Promise.all([
    prisma.comment.findMany({
      where: { targetType, targetId },
      orderBy: { createdAt: "asc" },
      skip: offset,
      take: limit,
      include: {
        user: { select: { handle: true, displayName: true, avatarUrl: true } },
      },
    }),
    prisma.comment.count({ where: { targetType, targetId } }),
  ]);

  return NextResponse.json({
    data: comments,
    meta: { total, offset, hasMore: offset + limit < total },
  });
}
