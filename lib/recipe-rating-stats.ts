import { prisma } from "@/lib/db";

export interface RecipeRatingStats {
  avgStars: number | null;      // from RecipeReview (canonical star source)
  wouldMakeAgainPct: number | null; // from RecipeRating (independent thumb signal)
  ratingCount: number;          // number of star reviews
}

export async function fetchRecipeRatingStats(
  recipeIds: string[]
): Promise<Map<string, RecipeRatingStats>> {
  if (recipeIds.length === 0) return new Map();

  const [ratings, reviews] = await Promise.all([
    prisma.recipeRating.findMany({
      where: { recipeId: { in: recipeIds } },
      select: { recipeId: true, wouldMakeAgain: true },
    }),
    prisma.recipeReview.findMany({
      where: { recipeId: { in: recipeIds }, status: "APPROVED" },
      select: { recipeId: true, rating: true },
    }),
  ]);

  const grouped = new Map<string, { stars: number[]; thumbs: boolean[] }>();
  for (const r of reviews) {
    const entry = grouped.get(r.recipeId) ?? { stars: [], thumbs: [] };
    entry.stars.push(r.rating);
    grouped.set(r.recipeId, entry);
  }
  for (const r of ratings) {
    const entry = grouped.get(r.recipeId) ?? { stars: [], thumbs: [] };
    if (r.wouldMakeAgain != null) entry.thumbs.push(r.wouldMakeAgain);
    grouped.set(r.recipeId, entry);
  }

  const result = new Map<string, RecipeRatingStats>();
  for (const [recipeId, { stars, thumbs }] of grouped) {
    const ratingCount = stars.length;
    const avgStars =
      stars.length > 0
        ? Math.round((stars.reduce((s, r) => s + r, 0) / stars.length) * 10) / 10
        : null;
    const wouldMakeAgainPct =
      thumbs.length > 0
        ? Math.round((thumbs.filter(Boolean).length / thumbs.length) * 100)
        : null;
    result.set(recipeId, { avgStars, wouldMakeAgainPct, ratingCount });
  }

  return result;
}
