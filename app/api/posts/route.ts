import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET /api/posts
// Returns paginated social feed — most recent approved posts with author and
// tagged bourbon. Query params: page (default 1), pageSize (default 20).
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const pageSize = Math.min(
    50,
    Math.max(1, parseInt(searchParams.get("pageSize") ?? "20", 10))
  );

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where: { status: "APPROVED" },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        user: {
          select: {
            id: true,
            handle: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        taggedWhiskey: {
          select: { id: true, name: true, brand: true },
        },
      },
    }),
    prisma.post.count({ where: { status: "APPROVED" } }),
  ]);

  // Attach like and comment counts
  const postIds = posts.map((p) => p.id);

  const [likeCounts, commentCounts] = await Promise.all([
    prisma.like.groupBy({
      by: ["targetId"],
      where: { targetType: "POST", targetId: { in: postIds } },
      _count: { userId: true },
    }),
    prisma.comment.groupBy({
      by: ["targetId"],
      where: { targetType: "POST", targetId: { in: postIds } },
      _count: { id: true },
    }),
  ]);

  const likeMap = Object.fromEntries(
    likeCounts.map((l) => [l.targetId, l._count.userId])
  );
  const commentMap = Object.fromEntries(
    commentCounts.map((c) => [c.targetId, c._count.id])
  );

  const data = posts.map((p) => ({
    ...p,
    likeCount: likeMap[p.id] ?? 0,
    commentCount: commentMap[p.id] ?? 0,
  }));

  return NextResponse.json({
    data,
    meta: { total, page, pageSize, pageCount: Math.ceil(total / pageSize) },
  });
}
