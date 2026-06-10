"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import StarSelector from "@/components/star-selector";
import LoadingDots from "@/components/loading-dots";
import VerificationNudge from "@/components/verification-nudge";
import { upsertRecipeReview, deleteRecipeReview } from "@/lib/actions/recipe-review";

interface RecipeReviewComposerProps {
  recipeId: string;
  isVerified: boolean;
  existingReview: { rating: number; body: string | null } | null;
}

export default function RecipeReviewComposer({
  recipeId,
  isVerified,
  existingReview,
}: RecipeReviewComposerProps) {
  const router = useRouter();
  const [stars, setStars] = useState(existingReview?.rating ?? 0);
  const [body, setBody] = useState(existingReview?.body ?? "");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const [deleting, setDeleting] = useState(false);
  const [mode, setMode] = useState<"compose" | "view">(existingReview ? "view" : "compose");

  if (!isVerified) {
    return (
      <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
        <VerificationNudge />
      </div>
    );
  }

  if (existingReview && mode === "view") {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold text-[#0d3c54]">Your review</p>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => { setStars(existingReview.rating); setBody(existingReview.body ?? ""); setMode("compose"); }}
              className="text-xs font-bold text-[#551904] hover:underline"
            >
              Edit
            </button>
            <button
              type="button"
              disabled={deleting}
              onClick={async () => {
                setDeleting(true);
                const result = await deleteRecipeReview({ recipeId });
                if ("error" in result) {
                  setError(result.error);
                  setDeleting(false);
                  return;
                }
                router.refresh();
              }}
              className="text-xs font-bold text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
            >
              {deleting ? "Deleting…" : "Delete"}
            </button>
          </div>
        </div>
        <StarSelector value={existingReview.rating} onChange={() => {}} size={20} />
        {existingReview.body && (
          <p className="text-sm text-gray-700 leading-relaxed">{existingReview.body}</p>
        )}
      </div>
    );
  }

  function handleSubmit() {
    if (stars === 0) { setError("Pick a star rating first."); return; }
    setError("");
    startTransition(async () => {
      const result = await upsertRecipeReview({ recipeId, rating: stars, body: body || null });
      if ("error" in result) {
        setError(result.error);
      } else {
        router.refresh();
        if (existingReview) setMode("view");
      }
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-bold text-[#0d3c54]">
        {existingReview ? "Edit your review" : "Leave a review"}
      </p>
      <StarSelector value={stars} onChange={setStars} size={24} />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="What did you think? (optional)"
        rows={3}
        maxLength={500}
        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0d3c54] transition resize-none"
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={pending || stars === 0}
          className="rounded-full bg-[#0d3c54] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#0a2f42] transition-colors disabled:opacity-50"
        >
          {pending
            ? <span className="flex items-center gap-2">Saving <LoadingDots /></span>
            : existingReview ? "Update review" : "Submit review"}
        </button>
        {existingReview && (
          <button
            type="button"
            onClick={() => { setStars(existingReview.rating); setBody(existingReview.body ?? ""); setMode("view"); }}
            className="rounded-full border border-gray-200 px-5 py-2.5 text-sm font-bold text-gray-500 hover:border-gray-300 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
