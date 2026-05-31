import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import Image from "next/image";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import BackButton from "@/components/back-button";
import { prisma } from "@/lib/db";
import { computeAvgRating } from "@/lib/format";
import AppBar from "@/components/app-bar";
import BottomNav from "@/components/bottom-nav";
import StarRating from "@/components/star-rating";
import WhiskeyPageTabs from "@/components/whiskey-page-tabs";
import { fetchInitialComments } from "@/lib/batch-comments";
import type { CommentWithUser } from "@/lib/actions/comment";

const CATEGORY_LABELS: Record<string, string> = {
  BOURBON: "Bourbon",
  RYE: "Rye",
  TENNESSEE: "Tennessee Whiskey",
  SCOTCH: "Scotch Whisky",
  IRISH: "Irish Whiskey",
  JAPANESE: "Japanese Whisky",
  OTHER: "Whiskey",
  ZERO_PROOF: "Zero-Proof",
};

export default async function WhiskeyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const { id } = await params;

  const whiskey = await prisma.whiskey.findUnique({
    where: { id },
    include: {
      reviews: {
        where: { status: "APPROVED" },
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { handle: true, displayName: true, avatarUrl: true } },
        },
      },
      posts: {
        where: { status: "APPROVED" },
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { handle: true, displayName: true, avatarUrl: true } },
          taggedWhiskey: { select: { id: true, name: true, brand: true } },
        },
      },
    },
  });

  if (!whiskey) notFound();

  const avgRating = computeAvgRating(whiskey.reviews);

  const reviewIds = whiskey.reviews.map((r) => r.id);
  const postIds = whiskey.posts.map((p) => p.id);

  const allOrClauses = [
    ...(reviewIds.length ? [{ targetType: "REVIEW" as const, targetId: { in: reviewIds } }] : []),
    ...(postIds.length ? [{ targetType: "POST" as const, targetId: { in: postIds } }] : []),
  ];

  const commentTargets = [
    ...reviewIds.map((id) => ({ targetType: "REVIEW" as const, targetId: id })),
    ...postIds.map((id) => ({ targetType: "POST" as const, targetId: id })),
  ];

  const [likeCounts, commentCounts, userLikes, initialCommentsMap] =
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
        ])
      : [[], [], [], new Map()];

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
  const commentsMap = initialCommentsMap as Map<string, CommentWithUser[]>;

  const reviewsWithSocial = whiskey.reviews.map((r) => ({
    ...r,
    likeCount: likeMap.get(`REVIEW:${r.id}`) ?? 0,
    commentCount: commentMap.get(`REVIEW:${r.id}`) ?? 0,
    isLiked: likedSet.has(`REVIEW:${r.id}`),
    initialComments: commentsMap.get(`REVIEW:${r.id}`) ?? [],
  }));

  const postsWithSocial = whiskey.posts.map((p) => ({
    ...p,
    likeCount: likeMap.get(`POST:${p.id}`) ?? 0,
    commentCount: commentMap.get(`POST:${p.id}`) ?? 0,
    isLiked: likedSet.has(`POST:${p.id}`),
    initialComments: commentsMap.get(`POST:${p.id}`) ?? [],
  }));

  const categoryLabel = CATEGORY_LABELS[whiskey.category] ?? "Whiskey";

  return (
    <div className="flex flex-col min-h-screen bg-[#fffbfa]">
      <AppBar />

      <main className="flex-1 pb-nav">
        {/* Hero section */}
        <div className="bg-white border-b border-gray-100 px-4 pt-5 pb-5 flex flex-col gap-3">
          <BackButton fallback="/search" />
          <div className="flex gap-5">
          {/* Bottle image */}
          <div className="w-24 h-36 flex-shrink-0 bg-[#fffbfa] border border-gray-100 rounded-2xl flex items-center justify-center overflow-hidden">
            <Image
              src={whiskey.imageUrl}
              alt={whiskey.name}
              width={60}
              height={110}
              className="object-contain"
            />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 flex flex-col gap-2 pt-1">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#551904]">
                {categoryLabel}
              </p>
              <h1 className="font-[family-name:var(--font-abhaya-libre)] text-2xl font-bold text-[#0d3c54] leading-tight mt-0.5">
                {whiskey.name}
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">{whiskey.brand}</p>
            </div>

            {/* Rating */}
            {avgRating !== null ? (
              <div className="flex items-center gap-2">
                <StarRating rating={avgRating} size="md" showValue />
                <span className="text-xs text-gray-400">
                  ({whiskey.reviews.length}{" "}
                  {whiskey.reviews.length === 1 ? "review" : "reviews"})
                </span>
              </div>
            ) : (
              <p className="text-xs text-gray-400">No ratings yet</p>
            )}

            {/* Quick specs */}
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {whiskey.proof != null && (
                <span className="text-xs text-gray-500">
                  <span className="font-bold text-[#0d3c54]">{whiskey.proof}</span> proof
                </span>
              )}
              {whiskey.ageYears && (
                <span className="text-xs text-gray-500">
                  <span className="font-bold text-[#0d3c54]">{whiskey.ageYears}</span> yr
                </span>
              )}
              {whiskey.distillery && (
                <span className="text-xs text-gray-500 truncate w-full">
                  {whiskey.distillery}
                </span>
              )}
            </div>
          </div>
          </div>{/* end flex gap-5 image+info row */}
        </div>

        {/* Description */}
        {whiskey.description && (
          <div className="px-4 py-4 border-b border-gray-100">
            <p className="text-sm text-gray-700 leading-relaxed">{whiskey.description}</p>
            {whiskey.mashBill && (
              <p className="text-xs text-gray-400 mt-2">
                <span className="font-bold">Mash bill:</span> {whiskey.mashBill}
              </p>
            )}
          </div>
        )}

        {/* Write a Review CTA */}
        <div className="px-4 py-4 border-b border-gray-100">
          <Link
            href={`/review/new?whiskeyId=${whiskey.id}`}
            className="block w-full rounded-full bg-[#0d3c54] py-3.5 text-sm font-bold text-white text-center hover:bg-[#0a2f42] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0d3c54] focus-visible:ring-offset-2"
          >
            Write a Review
          </Link>
        </div>

        {/* Tabs: Recipes (primary) | Reviews | Photos & Posts */}
        <WhiskeyPageTabs
          whiskeyId={whiskey.id}
          whiskeyName={whiskey.name}
          reviews={reviewsWithSocial}
          posts={postsWithSocial}
        />
      </main>

      <BottomNav />
    </div>
  );
}
