"use server";

import { prisma } from "@/lib/db";
import { requireVerifiedUser } from "@/lib/require-verified";

export async function toggleFollow({
  targetUserId,
}: {
  targetUserId: string;
}): Promise<{ following: boolean } | { error: string }> {
  const auth = await requireVerifiedUser();
  if ("error" in auth) return auth;

  const followerId = auth.userId;
  const followingId = targetUserId;

  const existing = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId, followingId } },
  });

  if (existing) {
    await prisma.follow.delete({
      where: { followerId_followingId: { followerId, followingId } },
    });
    return { following: false };
  }

  await prisma.follow.create({
    data: { followerId, followingId },
  });
  return { following: true };
}
