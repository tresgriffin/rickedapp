"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Star, ThumbsUp, ThumbsDown } from "lucide-react";
import { publishRickRecipe } from "@/lib/actions/rick-recipe";
import LoadingDots from "@/components/loading-dots";

export default function PublishRecipePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [stars, setStars] = useState<number>(0);
  const [hoveredStar, setHoveredStar] = useState<number>(0);
  const [wouldMakeAgain, setWouldMakeAgain] = useState<boolean | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePublish() {
    if (!stars) {
      setError("Give it at least one star to publish.");
      return;
    }
    setPending(true);
    const result = await publishRickRecipe(id, stars, wouldMakeAgain);
    if ("error" in result) {
      setError(result.error);
      setPending(false);
    }
    // On success, publishRickRecipe redirects — no client-side nav needed
  }

  return (
    <div className="min-h-screen bg-[#fffbfa] flex flex-col">
      <div className="flex-1 px-4 py-10 max-w-sm mx-auto w-full flex flex-col gap-8">
        <div className="text-center">
          <div className="text-4xl mb-3">🥃</div>
          <h1 className="text-2xl font-bold text-[#0d3c54] mb-2">You made it.</h1>
          <p className="text-sm text-gray-500">
            Rate it and we&apos;ll publish it to your profile and the recipe feed.
          </p>
        </div>

        {/* Star rating — required */}
        <div className="flex flex-col items-center gap-3">
          <p className="text-xs font-bold uppercase tracking-widest text-[#0d3c54]">
            How&apos;d it turn out?
          </p>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setStars(n)}
                onMouseEnter={() => setHoveredStar(n)}
                onMouseLeave={() => setHoveredStar(0)}
                className="transition-transform active:scale-90"
                aria-label={`${n} star${n > 1 ? "s" : ""}`}
              >
                <Star
                  size={36}
                  className={
                    n <= (hoveredStar || stars)
                      ? "fill-[#e6a817] text-[#e6a817]"
                      : "text-gray-200"
                  }
                />
              </button>
            ))}
          </div>
        </div>

        {/* Would make again — optional */}
        <div className="flex flex-col items-center gap-3">
          <p className="text-xs font-bold uppercase tracking-widest text-[#0d3c54]">
            Would you make it again? <span className="text-gray-400 font-normal normal-case tracking-normal">(optional)</span>
          </p>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setWouldMakeAgain(wouldMakeAgain === true ? null : true)}
              className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold border transition-colors ${
                wouldMakeAgain === true
                  ? "bg-[#0d3c54] text-white border-[#0d3c54]"
                  : "bg-white text-gray-500 border-gray-200 hover:border-[#0d3c54]/30"
              }`}
            >
              <ThumbsUp size={16} />
              Yeah
            </button>
            <button
              type="button"
              onClick={() => setWouldMakeAgain(wouldMakeAgain === false ? null : false)}
              className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold border transition-colors ${
                wouldMakeAgain === false
                  ? "bg-[#551904] text-white border-[#551904]"
                  : "bg-white text-gray-500 border-gray-200 hover:border-[#551904]/30"
              }`}
            >
              <ThumbsDown size={16} />
              Not really
            </button>
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600 text-center">{error}</p>
        )}

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={handlePublish}
            disabled={pending || !stars}
            className="w-full rounded-full bg-[#0d3c54] py-3 text-sm font-bold text-white hover:bg-[#0d3c54]/90 transition-colors disabled:opacity-40"
          >
            {pending ? <span className="flex items-center justify-center gap-2">Publishing <LoadingDots /></span> : "Publish recipe"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            disabled={pending}
            className="w-full rounded-full border border-gray-200 py-3 text-sm font-bold text-gray-500 hover:border-[#0d3c54]/30 transition-colors disabled:opacity-40"
          >
            Not yet
          </button>
        </div>
      </div>
    </div>
  );
}
