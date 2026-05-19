import Link from "next/link";
import StarRating from "@/components/star-rating";
import { timeAgo } from "@/lib/format";

interface RecipeReviewCardProps {
  review: {
    id: string;
    rating: number;
    body: string | null;
    createdAt: Date;
    recipe: {
      id: string;
      title: string;
    };
  };
}

export default function RecipeReviewCard({ review }: RecipeReviewCardProps) {
  return (
    <article className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col gap-2">
      <div className="flex items-start justify-between gap-3">
        <Link
          href={`/recipe/${review.recipe.id}`}
          className="text-sm font-bold text-[#0d3c54] hover:underline leading-tight flex-1"
        >
          {review.recipe.title}
        </Link>
        <StarRating rating={review.rating} size="sm" />
      </div>
      {review.body && (
        <p className="text-sm text-gray-700 leading-relaxed">{review.body}</p>
      )}
      <p className="text-xs text-gray-400">{timeAgo(review.createdAt)}</p>
    </article>
  );
}
