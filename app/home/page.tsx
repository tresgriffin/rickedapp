import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { computeAvgRating } from "@/lib/format";
import { fetchInitialComments } from "@/lib/batch-comments";
import { fetchRecipeRatingStats, type RecipeRatingStats } from "@/lib/recipe-rating-stats";
import AppBar from "@/components/app-bar";
import BottomNav from "@/components/bottom-nav";
import PostCard from "@/components/post-card";
import RecipeCard from "@/components/recipe-card";
import RickCard from "@/components/rick-card";
import StarRating from "@/components/star-rating";
import EmptyState from "@/components/empty-state";

async function getTopRatedWhiskeys() {
  const whiskeys = await prisma.whiskey.findMany({
    include: {
      reviews: { where: { status: "APPROVED" }, select: { rating: true } },
    },
  });
  return whiskeys
    .map((w) => ({
      id: w.id,
      name: w.name,
      brand: w.brand,
      imageUrl: w.imageUrl,
      avgRating: computeAvgRating(w.reviews),
      reviewCount: w.reviews.length,
    }))
    .filter((w) => w.avgRating !== null)
    .sort((a, b) => (b.avgRating ?? 0) - (a.avgRating ?? 0))
    .slice(0, 10);
}

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
  const [rawPosts, rawRecipes, topWhiskeys] = await Promise.all([
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
      },
    }),
    getTopRatedWhiskeys(),
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

      <main className="flex-1 pb-20">
        {/* ── Top Rated discovery strip ─────────────────────────────────────────
            PHASE 4 TODO: When photo uploads land at scale, consider augmenting
            this strip with user-submitted photos. The "Top Rated" strip should
            remain as a permanent discovery element even after photos exist.
        ──────────────────────────────────────────────────────────────────────── */}
        {topWhiskeys.length > 0 && (
          <section className="pt-4 pb-2">
            <div className="flex items-baseline justify-between px-4 mb-2">
              <h2 className="text-xs font-bold uppercase tracking-widest text-[#0d3c54]">
                Top Rated
              </h2>
              <Link href="/search" className="text-xs font-bold text-[#551904] hover:underline">
                See all
              </Link>
            </div>
            <div className="flex gap-3 overflow-x-auto no-scrollbar px-4 pb-1">
              {topWhiskeys.map((w) => (
                <Link
                  key={w.id}
                  href={`/whiskey/${w.id}`}
                  className="flex-shrink-0 w-28 flex flex-col items-center gap-1.5 bg-white rounded-2xl border border-gray-100 shadow-sm p-3 hover:border-[#0d3c54]/20 transition-colors active:scale-95"
                >
                  <div className="w-14 h-20 flex items-center justify-center">
                    <Image src={w.imageUrl} alt={w.name} width={40} height={72} className="object-contain" />
                  </div>
                  <p className="text-[11px] font-bold text-[#0d3c54] text-center line-clamp-2 leading-tight">
                    {w.name}
                  </p>
                  {w.avgRating && <StarRating rating={w.avgRating} size="sm" showValue />}
                </Link>
              ))}
            </div>
          </section>
        )}

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
