import Link from "next/link";
import Avatar from "@/components/avatar";
import StarRating from "@/components/star-rating";
import { timeAgo } from "@/lib/format";

interface ReviewCardProps {
  review: {
    id: string;
    rating: number;
    body: string;
    createdAt: Date;
    user: {
      handle: string | null;
      displayName: string | null;
      avatarUrl: string | null;
    };
    // Optional — shown when reviewing from a profile (not a brand page)
    whiskey?: { id: string; name: string; brand: string } | null;
  };
}

export default function ReviewCard({ review }: ReviewCardProps) {
  return (
    <article className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Avatar
          displayName={review.user.displayName}
          avatarUrl={review.user.avatarUrl}
          size="md"
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-[#0d3c54] truncate">
            {review.user.displayName ?? review.user.handle ?? "Someone"}
          </p>
          <p className="text-xs text-gray-400">
            @{review.user.handle} · {timeAgo(review.createdAt)}
          </p>
        </div>
        <StarRating rating={review.rating} size="sm" />
      </div>

      {/* Optional whiskey link (shown on profile, not on brand page) */}
      {review.whiskey && (
        <Link
          href={`/whiskey/${review.whiskey.id}`}
          className="self-start text-xs font-bold text-[#551904] hover:underline"
        >
          {review.whiskey.name}
          <span className="font-normal text-gray-400"> · {review.whiskey.brand}</span>
        </Link>
      )}

      {/* Body */}
      <p className="text-sm text-black leading-relaxed">{review.body}</p>
    </article>
  );
}
