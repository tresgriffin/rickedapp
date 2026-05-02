"use client";

import { useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { ChevronLeft, ImagePlus } from "lucide-react";
import Link from "next/link";
import StarSelector from "@/components/star-selector";
import LoadingDots from "@/components/loading-dots";
import SuccessOverlay from "@/components/success-overlay";
import AppBar from "@/components/app-bar";
import { createReview } from "@/lib/actions/review";

interface WhiskeySummary {
  id: string;
  name: string;
  brand: string;
}

export default function NewReviewPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const whiskeyId = searchParams.get("whiskeyId") ?? "";

  const [whiskey, setWhiskey] = useState<WhiskeySummary | null>(null);
  // Initialize based on whether we have a whiskeyId to fetch
  const [loadingWhiskey, setLoadingWhiskey] = useState(!!whiskeyId);
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!whiskeyId) return;
    fetch(`/api/whiskeys/${whiskeyId}`)
      .then((r) => r.json())
      .then((d) => setWhiskey({ id: d.id, name: d.name, brand: d.brand }))
      .catch(() => {})
      .finally(() => setLoadingWhiskey(false));
  }, [whiskeyId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!rating) { setError("Pick a star rating before you post."); return; }
    if (body.trim().length < 10) { setError("Write at least 10 characters. Plain language is fine."); return; }

    setSubmitting(true);
    const fd = new FormData();
    fd.append("whiskeyId", whiskeyId);
    fd.append("rating", String(rating));
    fd.append("body", body.trim());
    if (mediaFile) fd.append("media", mediaFile);

    const result = await createReview(fd);
    setSubmitting(false);

    if ("error" in result) {
      setError(result.error);
    } else {
      setSuccess(true);
    }
  }

  if (!whiskeyId || (!loadingWhiskey && !whiskey)) {
    return (
      <div className="flex flex-col min-h-screen bg-[#fffbfa]">
        <AppBar plain />
        <main className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center">
          <p className="text-sm font-bold text-[#0d3c54]">No whiskey selected.</p>
          <p className="text-xs text-gray-500">Head to Search, find a bottle, and tap Write a Review from there.</p>
          <Link href="/search" className="mt-2 rounded-full bg-[#0d3c54] px-6 py-2.5 text-sm font-bold text-white">
            Search
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#fffbfa]">
      <AppBar plain />

      {success && (
        <SuccessOverlay
          variant="review"
          onClose={() => router.replace(`/whiskey/${whiskeyId}`)}
        />
      )}

      <main className="flex-1 px-5 py-5 flex flex-col gap-5 max-w-lg mx-auto w-full">
        {/* Back */}
        <Link
          href={whiskeyId ? `/whiskey/${whiskeyId}` : "/search"}
          className="flex items-center gap-1 text-sm text-[#551904] font-bold w-fit"
        >
          <ChevronLeft size={16} />
          {whiskey ? whiskey.name : "Back"}
        </Link>

        <div>
          <h1 className="font-[family-name:var(--font-abhaya-libre)] text-2xl font-bold text-[#0d3c54]">
            Write a Review
          </h1>
          {whiskey && (
            <p className="text-sm text-gray-500 mt-0.5">
              {whiskey.name} · {whiskey.brand}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Star rating */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-[#0d3c54]">Your rating</label>
            <StarSelector value={rating} onChange={setRating} />
            {!rating && (
              <p className="text-xs text-gray-400">Tap a star to rate.</p>
            )}
          </div>

          {/* Review body */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="body" className="text-sm font-bold text-[#0d3c54]">
              Your review
            </label>
            <textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={5}
              placeholder="What did you think? Plain language is fine. You're not writing for a magazine."
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-black placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-[#0d3c54] transition"
            />
            <p className="text-xs text-gray-400 text-right">
              {body.trim().length}/10 min
            </p>
          </div>

          {/* Photo upload */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-[#0d3c54]">
              Photo <span className="font-normal text-gray-400">(optional)</span>
            </label>
            {mediaFile ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-700 truncate flex-1">{mediaFile.name}</span>
                <button
                  type="button"
                  onClick={() => { setMediaFile(null); if (fileRef.current) fileRef.current.value = ""; }}
                  className="text-xs text-[#551904] font-bold"
                >
                  Remove
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex items-center gap-2 rounded-xl border-2 border-[#0d3c54] px-4 py-2.5 text-sm font-bold text-[#0d3c54] hover:bg-[#0d3c54]/5 transition-colors w-fit"
              >
                <ImagePlus size={16} />
                Upload a photo
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setMediaFile(e.target.files?.[0] ?? null)}
            />
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-[#0d3c54] py-3.5 text-sm font-bold text-white hover:bg-[#0a2f42] transition-colors disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0d3c54] focus-visible:ring-offset-2"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                Posting <LoadingDots />
              </span>
            ) : "Post Your Review"}
          </button>
        </form>
      </main>
    </div>
  );
}
