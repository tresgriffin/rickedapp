import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fetchInitialComments } from "@/lib/batch-comments";
import { fetchRecipeRatingStats, type RecipeRatingStats } from "@/lib/recipe-rating-stats";
import AppBar from "@/components/app-bar";
import BottomNav from "@/components/bottom-nav";
import PostCard from "@/components/post-card";
import RecipeCard from "@/components/recipe-card";
import RickCard from "@/components/rick-card";
import EmptyState from "@/components/empty-state";
import VerificationBannerServer from "@/components/verification-banner-server";

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  // Onboarding gate — redirect new users to the Rick handshake
  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { hasSeenRickOnboarding: true },
  });
  if (!currentUser?.hasSeenRickOnboarding) redirect("/welcome");

  // ── Fetch posts and recipes only (reviews demoted from feed) ──────────────
  const [rawPosts, rawRecipes] = await Promise.all([
    prisma.post.findMany({
      where: { status: "APPROVED" },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        user: { select: { handle: true, displayName: true, avatarUrl: true } },
        taggedWhiskey: { select: { id: true, name: true, brand: true } },
      },
    }),
    prisma.recipe.findMany({
      where: { status: "APPROVED", isPublished: true },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        user: { select: { handle: true, displayName: true, avatarUrl: true } },
        taggedWhiskey: { select: { id: true, name: true, brand: true } },
      },
    }),
  ]);

  // ── Merge and sort ────────────────────────────────────────────────────────
  type FeedItem =
    | { kind: "post"; item: (typeof rawPosts)[number] }
    | { kind: "recipe"; item: (typeof rawRecipes)[number] };

  const merged: FeedItem[] = [
    ...rawPosts.map((item) => ({ kind: "post" as const, item })),
    ...rawRecipes.map((item) => ({ kind: "recipe" as const, item })),
  ]
    .sort((a, b) => b.item.createdAt.getTime() - a.item.createdAt.getTime())
    .slice(0, 30);

  const postIds = merged.filter((f) => f.kind === "post").map((f) => f.item.id);
  const recipeIds = merged.filter((f) => f.kind === "recipe").map((f) => f.item.id);

  const allOrClauses = [
    ...(postIds.length ? [{ targetType: "POST" as const, targetId: { in: postIds } }] : []),
    ...(recipeIds.length ? [{ targetType: "RECIPE" as const, targetId: { in: recipeIds } }] : []),
  ];

  const commentTargets = merged.map((f) => ({
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

  // PHASE 6: feed personalization by following graph would slot in here
  // PHASE 6: Personalize feed order by following graph — sort followed users' content first.

  return (
    <div className="flex flex-col min-h-screen bg-[#fffbfa]">
      <AppBar />
      <VerificationBannerServer />

      <main className="flex-1 pb-nav">
        {/* FUTURE: surface a "Top Rated Recipes" strip here once recipes accumulate
            rating data; consider an adaptive fallback that switches between top
            recipes and top whiskeys based on data availability. */}

        {/* ── Rick card (per-session dismissible) ──────────────────────────── */}
        <div className="pt-4 pb-2">
          <RickCard />
        </div>

        {/* ── Feed (posts + recipes only; reviews are on brand pages) ──────── */}
        <section className="px-4 pt-2 flex flex-col gap-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#0d3c54]">
            What&apos;s pouring
          </h2>

          {merged.length === 0 ? (
            <EmptyState
              message="The feed's empty right now."
              sub="Be the first. Post what's in your glass."
            />
          ) : (
            merged.map((entry) => {
              const typeKey = entry.kind.toUpperCase() as "POST" | "RECIPE";
              const mapKey = `${typeKey}:${entry.item.id}`;
              const likeCount = likeMap.get(mapKey) ?? 0;
              const commentCount = commentMap.get(mapKey) ?? 0;
              const isLiked = likedSet.has(mapKey);
              const initialComments =
                (initialCommentsMap as Map<string, unknown[]>).get(mapKey) ?? [];

              if (entry.kind === "post") {
                return (
                  <PostCard
                    key={mapKey}
                    post={{ ...entry.item, likeCount, commentCount }}
                    isLiked={isLiked}
                    initialComments={
                      initialComments as Parameters<typeof PostCard>[0]["initialComments"]
                    }
                    viewerId={session.user.id}
                  />
                );
              }

              const ratingStats = (recipeRatings as Map<string, RecipeRatingStats>).get(entry.item.id);

              return (
                <RecipeCard
                  key={mapKey}
                  recipe={{ ...entry.item, likeCount, commentCount }}
                  isLiked={isLiked}
                  initialComments={
                    initialComments as Parameters<typeof RecipeCard>[0]["initialComments"]
                  }
                  ratingStats={ratingStats}
                />
              );
            })
          )}
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
