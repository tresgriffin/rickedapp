"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export interface RecipeRatingResult {
  stars: number | null;
  wouldMakeAgain: boolean | null;
}

export async function upsertRecipeRating({
  recipeId,
  stars,
  wouldMakeAgain,
}: {
  recipeId: string;
  stars?: number | null;
  wouldMakeAgain?: boolean | null;
}): Promise<{ rating: RecipeRatingResult } | { error: string }> {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "Not signed in." };

  if (stars == null && wouldMakeAgain == null) {
    return { error: "Rate with stars or the thumb. At least one." };
  }
  if (stars != null && (stars < 1 || stars > 5)) {
    return { error: "Stars must be between 1 and 5." };
  }

  const rating = await prisma.recipeRating.upsert({
    where: { userId_recipeId: { userId: session.user.id, recipeId } },
    create: { userId: session.user.id, recipeId, stars: stars ?? null, wouldMakeAgain: wouldMakeAgain ?? null },
    update: {
      ...(stars !== undefined && { stars }),
      ...(wouldMakeAgain !== undefined && { wouldMakeAgain }),
    },
  });

  return { rating: { stars: rating.stars, wouldMakeAgain: rating.wouldMakeAgain } };
}
