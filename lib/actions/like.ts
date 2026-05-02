"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { LikeTargetType } from "@/app/generated/prisma/client";

// PHASE 6: Add rate limiting here (e.g., max 60 likes per user per minute)
//   to prevent like-farming and API abuse before public launch.

export async function toggleLike({
  targetType,
  targetId,
}: {
  targetType: LikeTargetType;
  targetId: string;
}): Promise<{ liked: boolean } | { error: string }> {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "Not signed in." };

  const userId = session.user.id;

  const existing = await prisma.like.findUnique({
    where: { userId_targetType_targetId: { userId, targetType, targetId } },
  });

  if (existing) {
    await prisma.like.delete({
      where: { userId_targetType_targetId: { userId, targetType, targetId } },
    });
    return { liked: false };
  }

  await prisma.like.create({
    data: { userId, targetType, targetId },
  });
  return { liked: true };
}
