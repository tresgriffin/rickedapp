"use client";

// Client wrapper for the recipe detail page's social actions area.
// Owns commentExpanded and commentCount state so the server component
// page doesn't need to become a client component just for comment state.

import { useState } from "react";
import { MessageCircle } from "lucide-react";
import LikeButton from "@/components/like-button";
import CommentSection from "@/components/comment-section";
import type { CommentWithUser } from "@/lib/actions/comment";

interface RecipePageActionsProps {
  targetId: string;
  isLiked: boolean;
  likeCount: number;
  initialComments: CommentWithUser[];
  commentCount: number;
  viewerId?: string;
}

export default function RecipePageActions({
  targetId,
  isLiked,
  likeCount,
  initialComments,
  commentCount: initialCommentCount,
  viewerId,
}: RecipePageActionsProps) {
  const [commentExpanded, setCommentExpanded] = useState(false);
  const [commentCount, setCommentCount] = useState(initialCommentCount);

  return (
    <div className="pt-1 border-t border-gray-100">
      {/* Action row — like + comment toggle on one line */}
      <div className="flex items-center gap-5">
        <LikeButton
          targetType="RECIPE"
          targetId={targetId}
          initialLiked={isLiked}
          initialCount={likeCount}
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
      {/* Thread renders full-width below the action row */}
      <CommentSection
        targetType="RECIPE"
        targetId={targetId}
        initialComments={initialComments}
        initialCount={initialCommentCount}
        expanded={commentExpanded}
        viewerId={viewerId}
        onCommentAdded={() => setCommentCount((n) => n + 1)}
        onCommentDeleted={() => setCommentCount((n) => Math.max(0, n - 1))}
      />
    </div>
  );
}
