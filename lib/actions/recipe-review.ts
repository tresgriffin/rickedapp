"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function upsertRecipeReview({
  recipeId,
  rating,
  body,
}: {
  recipeId: string;
  rating: number;
  body?: string | null;
}): Promise<{ ok: true } | { error: string }> {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "Not signed in." };

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { emailVerified: true },
  });
  if (!user?.emailVerified) return { error: "Verify your email to leave a review." };

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { error: "Rating must be between 1 and 5." };
  }

  await prisma.recipeReview.upsert({
    where: { userId_recipeId: { userId: session.user.id, recipeId } },
    create: { userId: session.user.id, recipeId, rating, body: body?.trim() || null },
    update: { rating, body: body?.trim() || null },
  });

  return { ok: true };
}

export async function deleteRecipeReview({
  recipeId,
}: {
  recipeId: string;
}): Promise<{ ok: true } | { error: string }> {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "Not signed in." };

  await prisma.recipeReview.deleteMany({
    where: { userId: session.user.id, recipeId },
  });

  return { ok: true };
}
