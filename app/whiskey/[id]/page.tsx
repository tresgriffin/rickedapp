import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import Image from "next/image";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { computeAvgRating } from "@/lib/format";
import AppBar from "@/components/app-bar";
import BottomNav from "@/components/bottom-nav";
import StarRating from "@/components/star-rating";
import WhiskeyPageTabs from "@/components/whiskey-page-tabs";

const CATEGORY_LABELS: Record<string, string> = {
  BOURBON: "Bourbon",
  RYE: "Rye",
  TENNESSEE: "Tennessee Whiskey",
  SCOTCH: "Scotch Whisky",
  IRISH: "Irish Whiskey",
  JAPANESE: "Japanese Whisky",
  OTHER: "Whiskey",
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

  // Attach like/comment counts to posts
  const postIds = whiskey.posts.map((p) => p.id);
  const [likeCounts, commentCounts] = await Promise.all(
    postIds.length > 0
      ? [
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
        ]
      : [Promise.resolve([]), Promise.resolve([])]
  );

  const likeMap = Object.fromEntries(
    (likeCounts as { targetId: string; _count: { userId: number } }[]).map((l) => [
      l.targetId,
      l._count.userId,
    ])
  );
  const commentMap = Object.fromEntries(
    (commentCounts as { targetId: string; _count: { id: number } }[]).map((c) => [
      c.targetId,
      c._count.id,
    ])
  );

  const postsWithCounts = whiskey.posts.map((p) => ({
    ...p,
    likeCount: likeMap[p.id] ?? 0,
    commentCount: commentMap[p.id] ?? 0,
  }));

  const categoryLabel = CATEGORY_LABELS[whiskey.category] ?? "Whiskey";

  return (
    <div className="flex flex-col min-h-screen bg-[#fffbfa]">
      <AppBar />

      <main className="flex-1 pb-20">
        {/* Hero section */}
        <div className="bg-white border-b border-gray-100 px-4 pt-6 pb-5 flex gap-5">
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
              {whiskey.proof && (
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
        <div className="px-4 py-4 border-b border-gray-100 flex flex-col gap-1">
          {/* Phase 4 will make this button link to /review/[id] */}
          <button
            type="button"
            disabled
            className="w-full rounded-full bg-[#0d3c54] py-3.5 text-sm font-bold text-white opacity-40 cursor-not-allowed"
          >
            Write a Review
          </button>
          <p className="text-center text-xs text-gray-400">
            Hold that thought — coming soon.
          </p>
        </div>

        {/* Tabs: Reviews | Photos & Posts */}
        <WhiskeyPageTabs
          reviews={whiskey.reviews}
          posts={postsWithCounts}
          whiskeyName={whiskey.name}
        />
      </main>

      <BottomNav />
    </div>
  );
}
