import { prisma } from "@/lib/db";

export interface RecipeRatingStats {
  avgStars: number | null;
  wouldMakeAgainPct: number | null;
  ratingCount: number;
}

export async function fetchRecipeRatingStats(
  recipeIds: string[]
): Promise<Map<string, RecipeRatingStats>> {
  if (recipeIds.length === 0) return new Map();

  const ratings = await prisma.recipeRating.findMany({
    where: { recipeId: { in: recipeIds } },
    select: { recipeId: true, stars: true, wouldMakeAgain: true },
  });

  const grouped = new Map<string, { stars: number[]; thumbs: boolean[] }>();
  for (const r of ratings) {
    const entry = grouped.get(r.recipeId) ?? { stars: [], thumbs: [] };
    if (r.stars != null) entry.stars.push(r.stars);
    if (r.wouldMakeAgain != null) entry.thumbs.push(r.wouldMakeAgain);
    grouped.set(r.recipeId, entry);
  }

  const result = new Map<string, RecipeRatingStats>();
  for (const [recipeId, { stars, thumbs }] of grouped) {
    const ratingCount = Math.max(stars.length, thumbs.length);
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
