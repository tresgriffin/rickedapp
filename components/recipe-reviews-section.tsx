import Avatar from "@/components/avatar";
import StarRating from "@/components/star-rating";
import RecipeReviewComposer from "@/components/recipe-review-composer";
import { timeAgo } from "@/lib/format";

interface ReviewItem {
  id: string;
  rating: number;
  body: string | null;
  createdAt: Date;
  user: {
    handle: string | null;
    displayName: string | null;
    avatarUrl: string | null;
  };
}

interface RecipeReviewsSectionProps {
  recipeId: string;
  reviews: ReviewItem[];
  myReview: { rating: number; body: string | null } | null;
  isVerified: boolean;
}

export default function RecipeReviewsSection({
  recipeId,
  reviews,
  myReview,
  isVerified,
}: RecipeReviewsSectionProps) {
  const avgRating =
    reviews.length > 0
      ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10) / 10
      : null;

  return (
    <section className="px-4 pt-5 pb-6 flex flex-col gap-5 border-t border-gray-100">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-widest text-[#0d3c54]">
          Reviews
        </h2>
        {avgRating !== null && (
          <div className="flex items-center gap-1.5">
            <StarRating rating={avgRating} size="sm" showValue />
            <span className="text-xs text-gray-400">
              {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
            </span>
          </div>
        )}
      </div>

      {reviews.length > 0 && (
        <div className="flex flex-col gap-4">
          {reviews.map((r) => (
            <div key={r.id} className="flex gap-3">
              <div className="flex-shrink-0">
                <Avatar
                  displayName={r.user.displayName}
                  avatarUrl={r.user.avatarUrl}
                  size="sm"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-bold text-[#0d3c54]">
                    {r.user.displayName ?? r.user.handle ?? "Someone"}
                  </p>
                  <StarRating rating={r.rating} size="sm" />
                  <span className="text-xs text-gray-400">{timeAgo(r.createdAt)}</span>
                </div>
                {r.body && (
                  <p className="text-sm text-gray-700 leading-relaxed mt-1">{r.body}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="border-t border-gray-100 pt-4">
        <RecipeReviewComposer
          recipeId={recipeId}
          isVerified={isVerified}
          existingReview={myReview}
        />
      </div>
    </section>
  );
}
