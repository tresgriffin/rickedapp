"use server";

import { prisma } from "@/lib/db";
import { requireVerifiedUser } from "@/lib/require-verified";

export async function upsertRecipeReview({
  recipeId,
  rating,
  body,
}: {
  recipeId: string;
  rating: number;
  body?: string | null;
}): Promise<{ ok: true } | { error: string }> {
  const auth = await requireVerifiedUser();
  if ("error" in auth) return auth;

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { error: "Rating must be between 1 and 5." };
  }

  // Self-review: block creating a new review on your own recipe.
  // Allow edits if a review already exists (e.g. created via publish flow).
  const existing = await prisma.recipeReview.findUnique({
    where: { userId_recipeId: { userId: auth.userId, recipeId } },
    select: { id: true },
  });
  if (!existing) {
    const recipe = await prisma.recipe.findUnique({
      where: { id: recipeId },
      select: { userId: true },
    });
    if (recipe?.userId === auth.userId) {
      return { error: "You can't review your own recipe." };
    }
  }

  await prisma.recipeReview.upsert({
    where: { userId_recipeId: { userId: auth.userId, recipeId } },
    create: { userId: auth.userId, recipeId, rating, body: body?.trim() || null },
    update: { rating, body: body?.trim() || null },
  });

  return { ok: true };
}

export async function deleteRecipeReview({
  recipeId,
}: {
  recipeId: string;
}): Promise<{ ok: true } | { error: string }> {
  const auth = await requireVerifiedUser();
  if ("error" in auth) return auth;

  await prisma.recipeReview.deleteMany({
    where: { userId: auth.userId, recipeId },
  });

  return { ok: true };
}
