"use client";

import { useState } from "react";
import { ThumbsUp } from "lucide-react";
import StarSelector from "@/components/star-selector";
import StarRating from "@/components/star-rating";
import { upsertRecipeRating } from "@/lib/actions/recipe-rating";
import type { RecipeRatingStats } from "@/lib/recipe-rating-stats";

interface RecipeRatingSectionProps {
  recipeId: string;
  stats: RecipeRatingStats;
  myRating: { stars: number | null; wouldMakeAgain: boolean | null } | null;
}

export default function RecipeRatingSection({
  recipeId,
  stats,
  myRating,
}: RecipeRatingSectionProps) {
  const [myStars, setMyStars] = useState(myRating?.stars ?? 0);
  const [myThumb, setMyThumb] = useState(myRating?.wouldMakeAgain ?? null);
  const [localStats, setLocalStats] = useState(stats);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function handleStars(stars: number) {
    const prev = myStars;
    setMyStars(stars);
    setError("");
    setPending(true);
    const result = await upsertRecipeRating({ recipeId, stars });
    setPending(false);
    if ("error" in result) { setMyStars(prev); setError(result.error); }
    else recomputeStats({ stars: result.rating.stars, wouldMakeAgain: myThumb });
  }

  async function handleThumb() {
    const next = myThumb === true ? null : true;
    const prev = myThumb;
    setMyThumb(next);
    setError("");
    setPending(true);
    const result = await upsertRecipeRating({ recipeId, wouldMakeAgain: next });
    setPending(false);
    if ("error" in result) { setMyThumb(prev); setError(result.error); }
    else recomputeStats({ stars: myStars || null, wouldMakeAgain: result.rating.wouldMakeAgain });
  }

  // Optimistic stats recompute: replaces the user's previous rating in the aggregate
  function recomputeStats(next: { stars: number | null; wouldMakeAgain: boolean | null }) {
    const prev = myRating;
    const wasRated = prev?.stars != null || prev?.wouldMakeAgain != null;
    const count = wasRated ? localStats.ratingCount : localStats.ratingCount + 1;

    // Stars average
    let avgStars = localStats.avgStars;
    if (next.stars != null) {
      const prevStarsCount = localStats.ratingCount;
      const prevSum = (localStats.avgStars ?? 0) * prevStarsCount;
      const prevContrib = wasRated && prev?.stars != null ? prev.stars : 0;
      avgStars = Math.round(((prevSum - prevContrib + next.stars) / Math.max(1, prevStarsCount)) * 10) / 10;
    }

    // Thumb percentage
    let wouldMakeAgainPct = localStats.wouldMakeAgainPct;
    if (next.wouldMakeAgain != null) {
      const prevThumbCount = localStats.ratingCount;
      const prevYes = Math.round(((localStats.wouldMakeAgainPct ?? 0) / 100) * prevThumbCount);
      const prevContrib = wasRated && prev?.wouldMakeAgain === true ? 1 : 0;
      const nextYes = prevYes - prevContrib + (next.wouldMakeAgain ? 1 : 0);
      wouldMakeAgainPct = Math.round((nextYes / Math.max(1, prevThumbCount)) * 100);
    }

    setLocalStats({ avgStars, wouldMakeAgainPct, ratingCount: count });
  }

  const hasStats = localStats.ratingCount > 0;

  return (
    <div className="flex flex-col gap-3">
      {/* Aggregate stats */}
      {hasStats ? (
        <div className="flex items-center gap-4 flex-wrap">
          {localStats.avgStars != null && (
            <div className="flex items-center gap-1.5">
              <StarRating rating={localStats.avgStars} size="sm" showValue />
              <span className="text-xs text-gray-400">
                from {localStats.ratingCount} {localStats.ratingCount === 1 ? "rating" : "ratings"}
              </span>
            </div>
          )}
          {localStats.wouldMakeAgainPct != null && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <ThumbsUp size={13} className="text-[#0d3c54]" />
              <span>
                <span className="font-bold text-[#0d3c54]">{localStats.wouldMakeAgainPct}%</span>
                {" "}would make again
              </span>
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-gray-400">
          Be the first to make this and let everyone know how it went.
        </p>
      )}

      {/* User's own rating */}
      <div className="border-t border-gray-100 pt-3 flex flex-col gap-3">
        <p className="text-xs font-bold text-[#0d3c54]">Your rating</p>

        <div className="flex items-center gap-4 flex-wrap">
          <StarSelector value={myStars} onChange={handleStars} size={28} />

          <button
            type="button"
            onClick={handleThumb}
            disabled={pending}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold border transition-colors ${
              myThumb === true
                ? "bg-[#0d3c54] border-[#0d3c54] text-white"
                : "border-gray-200 text-gray-500 hover:border-[#0d3c54]/40"
            }`}
          >
            <ThumbsUp size={13} />
            {myThumb === true ? "Made it again" : "Would make again"}
          </button>
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    </div>
  );
}
