"use client";

import { useState } from "react";
import { ThumbsUp } from "lucide-react";
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
  const [myThumb, setMyThumb] = useState(myRating?.wouldMakeAgain ?? null);
  const [localPct, setLocalPct] = useState(stats.wouldMakeAgainPct);
  const [localCount, setLocalCount] = useState(stats.ratingCount);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function handleThumb() {
    const next = myThumb === true ? null : true;
    const prev = myThumb;
    setMyThumb(next);
    setError("");
    setPending(true);
    const result = await upsertRecipeRating({ recipeId, wouldMakeAgain: next });
    setPending(false);
    if ("error" in result) {
      setMyThumb(prev);
      setError(result.error);
    } else {
      // Optimistic thumb pct recompute
      const wasThumb = prev === true;
      const count = wasThumb ? localCount : localCount + 1;
      const prevYes = Math.round(((localPct ?? 0) / 100) * localCount);
      const nextYes = prevYes - (wasThumb ? 1 : 0) + (next === true ? 1 : 0);
      setLocalPct(count > 0 ? Math.round((nextYes / count) * 100) : null);
      setLocalCount(count);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {localPct != null && (
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <ThumbsUp size={13} className="text-[#0d3c54]" />
          <span>
            <span className="font-bold text-[#0d3c54]">{localPct}%</span>
            {" "}would make again
          </span>
        </div>
      )}

      <div className="border-t border-gray-100 pt-3">
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
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      </div>
    </div>
  );
}
