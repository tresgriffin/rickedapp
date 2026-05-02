"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function toggleFollow({
  targetUserId,
}: {
  targetUserId: string;
}): Promise<{ following: boolean } | { error: string }> {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "Not signed in." };

  const followerId = session.user.id;
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
