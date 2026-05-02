import { prisma } from "@/lib/db";
import type { LikeTargetType } from "@/app/generated/prisma/client";
import type { CommentWithUser } from "@/lib/actions/comment";

interface Target {
  targetType: LikeTargetType;
  targetId: string;
}

/**
 * Batch-fetches the first 5 comments for a list of targets in a single query.
 * Returns a Map keyed by "TYPE:id".
 *
 * Because Comment uses a polymorphic targetType/targetId pattern (no FK back-refs),
 * Prisma doesn't expose a `comments` relation on Post/Review/Recipe models, so
 * we batch-fetch here instead of using `include`.
 */
export async function fetchInitialComments(
  targets: Target[]
): Promise<Map<string, CommentWithUser[]>> {
  if (targets.length === 0) return new Map();

  const comments = await prisma.comment.findMany({
    where: { OR: targets.map(({ targetType, targetId }) => ({ targetType, targetId })) },
    orderBy: { createdAt: "asc" },
    include: {
      user: { select: { handle: true, displayName: true, avatarUrl: true } },
    },
  });

  const result = new Map<string, CommentWithUser[]>();
  for (const c of comments as CommentWithUser[]) {
    // c has targetType and targetId from the query result
    const raw = c as CommentWithUser & { targetType: string; targetId: string };
    const key = `${raw.targetType}:${raw.targetId}`;
    const arr = result.get(key) ?? [];
    if (arr.length < 5) result.set(key, [...arr, c]);
  }

  return result;
}
