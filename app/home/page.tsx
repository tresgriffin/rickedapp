import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { computeAvgRating } from "@/lib/format";
import AppBar from "@/components/app-bar";
import BottomNav from "@/components/bottom-nav";
import PostCard from "@/components/post-card";
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

async function getFeedPosts() {
  const posts = await prisma.post.findMany({
    where: { status: "APPROVED" },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: {
      user: { select: { handle: true, displayName: true, avatarUrl: true } },
      taggedWhiskey: { select: { id: true, name: true, brand: true } },
    },
  });

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

  const likeMap = Object.fromEntries(likeCounts.map((l) => [l.targetId, l._count.userId]));
  const commentMap = Object.fromEntries(commentCounts.map((c) => [c.targetId, c._count.id]));

  return posts.map((p) => ({
    ...p,
    likeCount: likeMap[p.id] ?? 0,
    commentCount: commentMap[p.id] ?? 0,
  }));
}

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const [topWhiskeys, posts] = await Promise.all([
    getTopRatedWhiskeys(),
    getFeedPosts(),
  ]);

  return (
    <div className="flex flex-col min-h-screen bg-[#fffbfa]">
      <AppBar />

      <main className="flex-1 pb-20">
        {/* ── Top Rated discovery strip ────────────────────────────────────
            PHASE 4 TODO: When photo uploads land, this strip can be augmented
            with user-submitted photos. The "Top Rated" strip should remain as
            a permanent discovery element — it's not scaffolding. Consider
            showing it alongside a "Recent Photos" strip once uploads exist.
        ──────────────────────────────────────────────────────────────────── */}
        {topWhiskeys.length > 0 && (
          <section className="pt-4 pb-2">
            <div className="flex items-baseline justify-between px-4 mb-2">
              <h2 className="text-xs font-bold uppercase tracking-widest text-[#0d3c54]">
                Top Rated
              </h2>
              <Link
                href="/search"
                className="text-xs font-bold text-[#551904] hover:underline"
              >
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
                    <Image
                      src={w.imageUrl}
                      alt={w.name}
                      width={40}
                      height={72}
                      className="object-contain"
                    />
                  </div>
                  <p className="text-[11px] font-bold text-[#0d3c54] text-center line-clamp-2 leading-tight">
                    {w.name}
                  </p>
                  {w.avgRating && (
                    <StarRating rating={w.avgRating} size="sm" showValue />
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── Feed ─────────────────────────────────────────────────────── */}
        <section className="px-4 pt-4 flex flex-col gap-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#0d3c54]">
            What&apos;s pouring
          </h2>

          {posts.length === 0 ? (
            <EmptyState
              message="The feed's empty right now."
              sub="Be the first. Post what's in your glass."
            />
          ) : (
            posts.map((post) => <PostCard key={post.id} post={post} />)
          )}
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
