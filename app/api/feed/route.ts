import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fetchInitialComments } from "@/lib/batch-comments";
import { fetchRecipeRatingStats, type RecipeRatingStats } from "@/lib/recipe-rating-stats";

// GET /api/feed
// Query params: cursorDate (ISO string), cursorId (string), pageSize (default 20)
// Returns the next page of merged posts + recipes, hydrated with like-state,
// comment counts, and rating stats — identical hydration to the SSR initial batch.
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const cursorDate = searchParams.get("cursorDate");
  const cursorId = searchParams.get("cursorId");
  const pageSize = Math.min(20, Math.max(1, parseInt(searchParams.get("pageSize") ?? "20", 10)));
  const fetchLimit = pageSize + 1; // one extra to detect hasMore

  // Compound cursor: return items older than (cursorDate, cursorId).
  // Sort is (createdAt DESC, id DESC) — the id tiebreaker prevents duplicates
  // or skips at timestamp collision boundaries (e.g. seed-script clusters).
  const cursorWhere = cursorDate && cursorId
    ? {
        OR: [
          { createdAt: { lt: new Date(cursorDate) } },
          {
            createdAt: { equals: new Date(cursorDate) },
            id: { lt: cursorId },
          },
        ],
      }
    : {};

  const [rawPosts, rawRecipes] = await Promise.all([
    prisma.post.findMany({
      where: { status: "APPROVED", ...cursorWhere },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: fetchLimit,
      include: {
        user: { select: { handle: true, displayName: true, avatarUrl: true } },
        taggedWhiskey: { select: { id: true, name: true, brand: true } },
      },
    }),
    prisma.recipe.findMany({
      where: { status: "APPROVED", isPublished: true, ...cursorWhere },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: fetchLimit,
      include: {
        user: { select: { handle: true, displayName: true, avatarUrl: true } },
        taggedWhiskey: { select: { id: true, name: true, brand: true } },
      },
    }),
  ]);

  type FeedItem =
    | { kind: "post"; item: (typeof rawPosts)[number] }
    | { kind: "recipe"; item: (typeof rawRecipes)[number] };

  const merged: FeedItem[] = [
    ...rawPosts.map((item) => ({ kind: "post" as const, item })),
    ...rawRecipes.map((item) => ({ kind: "recipe" as const, item })),
  ].sort((a, b) => {
    const diff = b.item.createdAt.getTime() - a.item.createdAt.getTime();
    if (diff !== 0) return diff;
    return b.item.id > a.item.id ? 1 : -1; // id desc tiebreaker
  });

  const hasMore = merged.length > pageSize;
  const page = merged.slice(0, pageSize);

  if (page.length === 0) {
    return NextResponse.json({ items: [], nextCursorDate: null, nextCursorId: null, hasMore: false });
  }

  // ── Hydration — identical logic to home/page.tsx SSR batch ───────────────

  const postIds = page.filter((f) => f.kind === "post").map((f) => f.item.id);
  const recipeIds = page.filter((f) => f.kind === "recipe").map((f) => f.item.id);

  const allOrClauses = [
    ...(postIds.length ? [{ targetType: "POST" as const, targetId: { in: postIds } }] : []),
    ...(recipeIds.length ? [{ targetType: "RECIPE" as const, targetId: { in: recipeIds } }] : []),
  ];

  const commentTargets = page.map((f) => ({
    targetType: f.kind.toUpperCase() as "POST" | "RECIPE",
    targetId: f.item.id,
  }));

  const [likeCounts, commentCounts, userLikes, initialCommentsMap, recipeRatings] =
    allOrClauses.length > 0
      ? await Promise.all([
          prisma.like.groupBy({
            by: ["targetType", "targetId"],
            where: { OR: allOrClauses },
            _count: { userId: true },
          }),
          prisma.comment.groupBy({
            by: ["targetType", "targetId"],
            where: { OR: allOrClauses },
            _count: { id: true },
          }),
          // Same like.findMany as SSR batch — userId from session for isLiked parity
          prisma.like.findMany({
            where: { userId: session.user.id, OR: allOrClauses },
            select: { targetType: true, targetId: true },
          }),
          fetchInitialComments(commentTargets),
          fetchRecipeRatingStats(recipeIds),
        ])
      : [[], [], [], new Map(), new Map()];

  const likeMap = new Map(
    (likeCounts as { targetType: string; targetId: string; _count: { userId: number } }[]).map(
      (l) => [`${l.targetType}:${l.targetId}`, l._count.userId]
    )
  );
  const commentMap = new Map(
    (commentCounts as { targetType: string; targetId: string; _count: { id: number } }[]).map(
      (c) => [`${c.targetType}:${c.targetId}`, c._count.id]
    )
  );
  const likedSet = new Set(
    (userLikes as { targetType: string; targetId: string }[]).map(
      (l) => `${l.targetType}:${l.targetId}`
    )
  );

  const items = page.map((entry) => {
    const typeKey = entry.kind.toUpperCase() as "POST" | "RECIPE";
    const mapKey = `${typeKey}:${entry.item.id}`;
    const likeCount = likeMap.get(mapKey) ?? 0;
    const commentCount = commentMap.get(mapKey) ?? 0;
    const isLiked = likedSet.has(mapKey);
    const initialComments = (initialCommentsMap as Map<string, unknown[]>).get(mapKey) ?? [];

    if (entry.kind === "recipe") {
      const stats =
        (recipeRatings as Map<string, RecipeRatingStats>).get(entry.item.id) ?? {
          avgStars: null,
          wouldMakeAgainPct: null,
          ratingCount: 0,
        };
      return {
        kind: "recipe" as const,
        item: { ...entry.item, likeCount, commentCount },
        isLiked,
        initialComments,
        ratingStats: stats,
      };
    }

    return {
      kind: "post" as const,
      item: { ...entry.item, likeCount, commentCount },
      isLiked,
      initialComments,
    };
  });

  const lastItem = page[page.length - 1];

  return NextResponse.json({
    items,
    nextCursorDate: lastItem.item.createdAt.toISOString(),
    nextCursorId: lastItem.item.id,
    hasMore,
  });
}
