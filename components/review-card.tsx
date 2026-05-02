import Link from "next/link";
import Image from "next/image";
import Avatar from "@/components/avatar";
import StarRating from "@/components/star-rating";
import { timeAgo } from "@/lib/format";

interface ReviewCardProps {
  review: {
    id: string;
    rating: number;
    body: string;
    mediaUrl?: string | null;
    createdAt: Date;
    user: {
      handle: string | null;
      displayName: string | null;
      avatarUrl: string | null;
    };
    // Optional: shown when displaying from a profile page, not a brand page
    whiskey?: { id: string; name: string; brand: string } | null;
  };
}

export default function ReviewCard({ review }: ReviewCardProps) {
  return (
    <article className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href={review.user.handle ? `/profile/${review.user.handle}` : "#"}
          className="flex-shrink-0"
          tabIndex={review.user.handle ? 0 : -1}
        >
          <Avatar
            displayName={review.user.displayName}
            avatarUrl={review.user.avatarUrl}
            size="md"
          />
        </Link>
        <div className="flex-1 min-w-0">
          <Link
            href={review.user.handle ? `/profile/${review.user.handle}` : "#"}
            className="text-sm font-bold text-[#0d3c54] truncate hover:underline block"
          >
            {review.user.displayName ?? review.user.handle ?? "Someone"}
          </Link>
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

      {/* Review photo */}
      {review.mediaUrl && (
        <div className="rounded-xl overflow-hidden relative aspect-[4/3] bg-gray-100">
          <Image
            src={review.mediaUrl}
            alt="Review photo"
            fill
            sizes="(max-width: 640px) 100vw, 600px"
            className="object-cover"
          />
        </div>
      )}
    </article>
  );
}
