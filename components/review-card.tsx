"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { MessageCircle } from "lucide-react";
import Avatar from "@/components/avatar";
import StarRating from "@/components/star-rating";
import LikeButton from "@/components/like-button";
import CommentSection from "@/components/comment-section";
import OwnerActionMenu from "@/components/owner-action-menu";
import { timeAgo } from "@/lib/format";
import type { CommentWithUser } from "@/lib/actions/comment";

interface ReviewCardProps {
  review: {
    id: string;
    userId: string;
    rating: number;
    body: string | null;
    mediaUrl?: string | null;
    createdAt: Date;
    user: {
      handle: string | null;
      displayName: string | null;
      avatarUrl: string | null;
    };
    // Optional: shown when displaying from a profile page, not a brand page
    whiskey?: { id: string; name: string; brand: string } | null;
    likeCount: number;
    commentCount: number;
  };
  isLiked: boolean;
  initialComments: CommentWithUser[];
  viewerId?: string;
}

export default function ReviewCard({ review, isLiked, initialComments, viewerId }: ReviewCardProps) {
  const [commentExpanded, setCommentExpanded] = useState(false);
  const [commentCount, setCommentCount] = useState(review.commentCount);

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
        {viewerId && review.userId === viewerId && (
          <OwnerActionMenu
            type="review"
            id={review.id}
            editHref={`/review/${review.id}/edit`}
          />
        )}
      </div>

      {/* Optional whiskey link (shown on profile and feed, not on brand page) */}
      {review.whiskey && (
        <Link
          href={`/whiskey/${review.whiskey.id}`}
          className="self-start text-xs font-bold text-[#551904] hover:underline"
        >
          {review.whiskey.name}
          <span className="font-normal text-gray-400"> · {review.whiskey.brand}</span>
        </Link>
      )}

      {/* Body — optional since schema allows null */}
      {review.body && <p className="text-sm text-black leading-relaxed">{review.body}</p>}

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

      {/* Actions: like + comment toggle on one row, thread full-width below */}
      <div className="pt-1 border-t border-gray-50">
        <div className="flex items-center gap-5">
          <LikeButton
            targetType="REVIEW"
            targetId={review.id}
            initialLiked={isLiked}
            initialCount={review.likeCount}
          />
          <button
            type="button"
            onClick={() => setCommentExpanded((v) => !v)}
            className={`flex items-center gap-1.5 transition-colors ${
              commentExpanded ? "text-[#0d3c54]" : "text-gray-400 hover:text-[#0d3c54]"
            }`}
            aria-label={`${commentCount} ${commentCount === 1 ? "comment" : "comments"}`}
            aria-expanded={commentExpanded}
          >
            <MessageCircle size={16} strokeWidth={commentExpanded ? 2 : 1.5} />
            <span className="text-xs font-medium">{commentCount}</span>
          </button>
        </div>
        <CommentSection
          targetType="REVIEW"
          targetId={review.id}
          initialComments={initialComments}
          initialCount={review.commentCount}
          expanded={commentExpanded}
          viewerId={viewerId}
          onCommentAdded={() => setCommentCount((n) => n + 1)}
          onCommentDeleted={() => setCommentCount((n) => Math.max(0, n - 1))}
        />
      </div>
    </article>
  );
}
