"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useParams } from "next/navigation";
import { ChevronLeft, ImagePlus } from "lucide-react";
import StarSelector from "@/components/star-selector";
import LoadingDots from "@/components/loading-dots";
import AppBar from "@/components/app-bar";
import { updateReview } from "@/lib/actions/review";

interface ReviewData {
  id: string;
  rating: number;
  body: string | null;
  mediaUrl: string | null;
  whiskey: { id: string; name: string; brand: string };
}

export default function EditReviewPage() {
  return (
    <Suspense>
      <EditReviewForm />
    </Suspense>
  );
}

function EditReviewForm() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const reviewId = params.id;

  const [review, setReview] = useState<ReviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [clearMedia, setClearMedia] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!reviewId) return;
    fetch(`/api/reviews/${reviewId}`)
      .then((r) => r.json())
      .then((d) => {
        setReview(d);
        setRating(d.rating ?? 0);
        setBody(d.body ?? "");
      })
      .catch(() => setError("Couldn't load your review."))
      .finally(() => setLoading(false));
  }, [reviewId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!rating) { setError("Pick a star rating before saving."); return; }

    setSubmitting(true);
    const fd = new FormData();
    fd.append("rating", String(rating));
    fd.append("body", body);
    if (mediaFile) fd.append("media", mediaFile);
    if (clearMedia) fd.append("clearMedia", "true");

    const result = await updateReview(reviewId, fd);
    setSubmitting(false);

    if ("error" in result) {
      setError(result.error);
      return;
    }

    router.back();
  }

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-[#fffbfa]">
        <AppBar plain />
        <div className="flex-1 flex items-center justify-center">
          <LoadingDots />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#fffbfa]">
      <AppBar plain />
      <main className="flex-1 px-4 py-6 max-w-lg mx-auto w-full flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex items-center gap-1 text-sm text-[#0d3c54]/70 hover:text-[#0d3c54] transition-colors -ml-1"
          >
            <ChevronLeft size={18} />
            <span className="font-bold">Back</span>
          </button>
        </div>

        {review && (
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#551904] mb-0.5">
              Edit review
            </p>
            <h1 className="font-[family-name:var(--font-abhaya-libre)] text-2xl font-bold text-[#0d3c54]">
              {review.whiskey.name}
            </h1>
            <p className="text-sm text-gray-500">{review.whiskey.brand}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Star rating */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-[#0d3c54]">Your rating</label>
            <StarSelector value={rating} onChange={setRating} />
          </div>

          {/* Body */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-[#0d3c54]">
              Your review <span className="font-normal text-gray-400">(optional)</span>
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="What did you think? Plain language is fine."
              rows={4}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0d3c54] transition resize-none"
            />
          </div>

          {/* Photo */}
          <div className="flex flex-col gap-2">
            <span className="text-sm font-bold text-[#0d3c54]">
              Photo <span className="font-normal text-gray-400">(optional)</span>
            </span>
            {review?.mediaUrl && !clearMedia && !mediaFile && (
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500">Current photo attached</span>
                <button
                  type="button"
                  onClick={() => setClearMedia(true)}
                  className="text-xs font-bold text-red-500 hover:underline"
                >
                  Remove
                </button>
              </div>
            )}
            {(clearMedia || !review?.mediaUrl) && !mediaFile && (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="self-start flex items-center gap-2 rounded-xl border border-dashed border-gray-300 px-4 py-2.5 text-sm text-gray-500 hover:border-[#0d3c54]/40 transition-colors"
              >
                <ImagePlus size={16} />
                Add photo
              </button>
            )}
            {mediaFile && (
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500 truncate max-w-[200px]">{mediaFile.name}</span>
                <button
                  type="button"
                  onClick={() => setMediaFile(null)}
                  className="text-xs font-bold text-red-500 hover:underline"
                >
                  Remove
                </button>
              </div>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null;
                setMediaFile(f);
                setClearMedia(false);
              }}
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={!rating || submitting}
            className="w-full rounded-full bg-[#0d3c54] text-white py-3 text-sm font-bold disabled:opacity-40 transition-opacity"
          >
            {submitting ? <LoadingDots /> : "Save Changes"}
          </button>
        </form>
      </main>
    </div>
  );
}
