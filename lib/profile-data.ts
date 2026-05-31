import { prisma } from "@/lib/db";
import { fetchInitialComments } from "@/lib/batch-comments";
import type { CommentWithUser } from "@/lib/actions/comment";

export async function fetchProfileData(
  where: { id: string } | { handle: string },
  viewerUserId: string,
  isOwnProfile = false
) {
  const user = await prisma.user.findUnique({
    where,
    include: {
      reviews: {
        where: { status: "APPROVED" },
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { handle: true, displayName: true, avatarUrl: true } },
          whiskey: { select: { id: true, name: true, brand: true } },
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
      recipes: {
        where: isOwnProfile
          ? { status: "APPROVED" }
          : { status: "APPROVED", isPublished: true },
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { handle: true, displayName: true, avatarUrl: true } },
          taggedWhiskey: { select: { id: true, name: true, brand: true } },
        },
      },
      recipeReviews: {
        where: { status: "APPROVED" },
        orderBy: { createdAt: "desc" },
        include: {
          recipe: { select: { id: true, title: true } },
        },
      },
      _count: { select: { followers: true, following: true } },
    },
  });

  if (!user) return null;

  const reviewIds = user.reviews.map((r) => r.id);
  const postIds = user.posts.map((p) => p.id);
  const recipeIds = user.recipes.map((r) => r.id);

  const orClauses = [
    ...(reviewIds.length ? [{ targetType: "REVIEW" as const, targetId: { in: reviewIds } }] : []),
    ...(postIds.length ? [{ targetType: "POST" as const, targetId: { in: postIds } }] : []),
    ...(recipeIds.length ? [{ targetType: "RECIPE" as const, targetId: { in: recipeIds } }] : []),
  ];

  const commentTargets = [
    ...reviewIds.map((id) => ({ targetType: "REVIEW" as const, targetId: id })),
    ...postIds.map((id) => ({ targetType: "POST" as const, targetId: id })),
    ...recipeIds.map((id) => ({ targetType: "RECIPE" as const, targetId: id })),
  ];

  const [likeCounts, commentCounts, userLikes, initialCommentsMap, isFollowingRow] =
    orClauses.length > 0
      ? await Promise.all([
          prisma.like.groupBy({
            by: ["targetType", "targetId"],
            where: { OR: orClauses },
            _count: { userId: true },
          }),
          prisma.comment.groupBy({
            by: ["targetType", "targetId"],
            where: { OR: orClauses },
            _count: { id: true },
          }),
          prisma.like.findMany({
            where: { userId: viewerUserId, OR: orClauses },
            select: { targetType: true, targetId: true },
          }),
          fetchInitialComments(commentTargets),
          prisma.follow.findUnique({
            where: {
              followerId_followingId: {
                followerId: viewerUserId,
                followingId: user.id,
              },
            },
          }),
        ])
      : await Promise.all([
          Promise.resolve([]),
          Promise.resolve([]),
          Promise.resolve([]),
          Promise.resolve(new Map<string, CommentWithUser[]>()),
          prisma.follow.findUnique({
            where: {
              followerId_followingId: {
                followerId: viewerUserId,
                followingId: user.id,
              },
            },
          }),
        ]);

  type LikeRow = { targetType: string; targetId: string; _count: { userId: number } };
  type CommentRow = { targetType: string; targetId: string; _count: { id: number } };
  type LikedRow = { targetType: string; targetId: string };

  const likeMap = new Map(
    (likeCounts as LikeRow[]).map((l) => [`${l.targetType}:${l.targetId}`, l._count.userId])
  );
  const commentMap = new Map(
    (commentCounts as CommentRow[]).map((c) => [`${c.targetType}:${c.targetId}`, c._count.id])
  );
  const likedSet = new Set(
    (userLikes as LikedRow[]).map((l) => `${l.targetType}:${l.targetId}`)
  );
  const commentsMap = initialCommentsMap as Map<string, CommentWithUser[]>;

  return {
    user: {
      ...user,
      reviews: user.reviews.map((r) => ({
        ...r,
        likeCount: likeMap.get(`REVIEW:${r.id}`) ?? 0,
        commentCount: commentMap.get(`REVIEW:${r.id}`) ?? 0,
        isLiked: likedSet.has(`REVIEW:${r.id}`),
        initialComments: commentsMap.get(`REVIEW:${r.id}`) ?? [],
      })),
      posts: user.posts.map((p) => ({
        ...p,
        likeCount: likeMap.get(`POST:${p.id}`) ?? 0,
        commentCount: commentMap.get(`POST:${p.id}`) ?? 0,
        isLiked: likedSet.has(`POST:${p.id}`),
        initialComments: commentsMap.get(`POST:${p.id}`) ?? [],
      })),
      recipes: user.recipes.map((r) => ({
        ...r,
        likeCount: likeMap.get(`RECIPE:${r.id}`) ?? 0,
        commentCount: commentMap.get(`RECIPE:${r.id}`) ?? 0,
        isLiked: likedSet.has(`RECIPE:${r.id}`),
        initialComments: commentsMap.get(`RECIPE:${r.id}`) ?? [],
      })),
    },
    isFollowing: !!isFollowingRow,
  };
}
