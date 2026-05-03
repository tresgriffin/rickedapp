import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fetchRecipeRatingStats } from "@/lib/recipe-rating-stats";

// GET /api/recipes
// Query params: q (title/description search), whiskeyId, page, pageSize (default 20)
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const whiskeyId = searchParams.get("whiskeyId") ?? "";
  const sortBy = searchParams.get("sortBy") ?? "recent"; // recent | stars | thumbs
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get("pageSize") ?? "20", 10)));

  // When a query is present, also find recipes tagged to whiskeys whose names match.
  // Ingredient-text matching is intentionally excluded (too fragile) — tagged-only only.
  let taggedWhiskeyIds: string[] = [];
  if (q) {
    const matchingWhiskeys = await prisma.whiskey.findMany({
      where: { name: { contains: q, mode: "insensitive" } },
      select: { id: true },
      take: 10,
    });
    taggedWhiskeyIds = matchingWhiskeys.map((w) => w.id);
  }

  const where = {
    status: "APPROVED" as const,
    isPublished: true,
    ...(q && {
      OR: [
        { title: { contains: q, mode: "insensitive" as const } },
        { description: { contains: q, mode: "insensitive" as const } },
        ...(taggedWhiskeyIds.length > 0
          ? [{ taggedWhiskeyId: { in: taggedWhiskeyIds } }]
          : []),
      ],
    }),
    ...(whiskeyId && { taggedWhiskeyId: whiskeyId }),
  };

  const [recipes, total] = await Promise.all([
    prisma.recipe.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        user: { select: { handle: true, displayName: true, avatarUrl: true } },
        taggedWhiskey: { select: { id: true, name: true, brand: true } },
      },
    }),
    prisma.recipe.count({ where }),
  ]);

  const recipeIds = recipes.map((r) => r.id);
  const ratingStatsMap = await fetchRecipeRatingStats(recipeIds);

  const data = recipes.map((r) => {
    const stats = ratingStatsMap.get(r.id) ?? { avgStars: null, wouldMakeAgainPct: null, ratingCount: 0 };
    return {
      id: r.id,
      title: r.title,
      description: r.description,
      mediaUrl: r.mediaUrl,
      ingredientCount: Array.isArray(r.ingredients) ? (r.ingredients as unknown[]).length : 0,
      isAiGenerated: r.isAiGenerated,
      createdAt: r.createdAt,
      user: r.user,
      taggedWhiskey: r.taggedWhiskey,
      ...stats,
    };
  });

  // Apply sort after fetching (rating stats not sortable in DB without a view)
  if (sortBy === "stars") {
    data.sort((a, b) => (b.avgStars ?? -1) - (a.avgStars ?? -1));
  } else if (sortBy === "thumbs") {
    data.sort((a, b) => (b.wouldMakeAgainPct ?? -1) - (a.wouldMakeAgainPct ?? -1));
  }

  return NextResponse.json({
    data,
    meta: { total, page, pageSize, pageCount: Math.ceil(total / pageSize) },
  });
}
