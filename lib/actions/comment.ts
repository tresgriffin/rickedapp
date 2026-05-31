"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { LikeTargetType } from "@/app/generated/prisma/client";

// PHASE 6: Add rate limiting here (e.g., max 30 comments per user per minute)
//   to prevent spam and API abuse before public launch.

export interface CommentWithUser {
  id: string;
  body: string;
  createdAt: Date;
  userId: string;
  user: {
    handle: string | null;
    displayName: string | null;
    avatarUrl: string | null;
  };
}

export async function addComment({
  targetType,
  targetId,
  body,
}: {
  targetType: LikeTargetType;
  targetId: string;
  body: string;
}): Promise<{ comment: CommentWithUser } | { error: string }> {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "Not signed in." };

  const trimmed = body.trim();
  if (!trimmed) return { error: "Comment can't be empty." };
  if (trimmed.length > 1000) return { error: "Keep it under 1000 characters." };

  const comment = await prisma.comment.create({
    data: {
      userId: session.user.id,
      targetType,
      targetId,
      body: trimmed,
    },
    include: {
      user: { select: { handle: true, displayName: true, avatarUrl: true } },
    },
  });

  return { comment };
}

export async function deleteComment({
  commentId,
}: {
  commentId: string;
}): Promise<{ ok: true } | { error: string }> {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "Not signed in." };

  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { userId: true },
  });

  if (!comment) return { error: "Comment not found." };
  if (comment.userId !== session.user.id) return { error: "Not authorized." };

  await prisma.comment.delete({ where: { id: commentId } });
  return { ok: true };
}
