"use client";

// FUTURE: one-level reply threading (Instagram/YouTube style) is a candidate
//   for post-launch v1.1. To add threading, this component would need to render
//   nested reply threads per comment and wire to a `replyToComment` action.
//   Keep the structure flat for now — CommentSection renders a single level only.

import { useState } from "react";
import Link from "next/link";
import { MessageCircle, Send } from "lucide-react";
import Avatar from "@/components/avatar";
import LoadingDots from "@/components/loading-dots";
import { addComment, type CommentWithUser } from "@/lib/actions/comment";
import { timeAgo } from "@/lib/format";
import type { LikeTargetType } from "@/app/generated/prisma/client";

interface CommentSectionProps {
  targetType: LikeTargetType;
  targetId: string;
  initialComments: CommentWithUser[];
  initialCount: number;
  // PHASE 6: onDeleteComment?: (commentId: string) => Promise<void>
  //   Wire this once comment deletion is implemented as a server action.
}

export default function CommentSection({
  targetType,
  targetId,
  initialComments,
  initialCount,
}: CommentSectionProps) {
  const [expanded, setExpanded] = useState(false);
  const [comments, setComments] = useState<CommentWithUser[]>(initialComments);
  const [count, setCount] = useState(initialCount);
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(initialCount > initialComments.length);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim() || submitting) return;
    setError("");
    setSubmitting(true);

    const result = await addComment({ targetType, targetId, body });
    setSubmitting(false);

    if ("error" in result) {
      setError(result.error);
      return;
    }

    setComments((prev) => [...prev, result.comment]);
    setCount((c) => c + 1);
    setBody("");
  }

  async function handleLoadMore() {
    setLoadingMore(true);
    try {
      const res = await fetch(
        `/api/comments?targetType=${targetType}&targetId=${targetId}&offset=${comments.length}`
      );
      const json = await res.json();
      setComments((prev) => [...prev, ...(json.data ?? [])]);
      setHasMore(json.meta?.hasMore ?? false);
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <div>
      {/* Toggle button */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className={`flex items-center gap-1.5 transition-colors ${
          expanded ? "text-[#0d3c54]" : "text-gray-400 hover:text-[#0d3c54]"
        }`}
        aria-label={`${count} ${count === 1 ? "comment" : "comments"}`}
        aria-expanded={expanded}
      >
        <MessageCircle size={16} strokeWidth={expanded ? 2 : 1.5} />
        <span className="text-xs font-medium">{count}</span>
      </button>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-gray-100 flex flex-col gap-3">
          {/* Comment list */}
          {comments.length === 0 && (
            <p className="text-xs text-gray-400">No comments yet. Be the first.</p>
          )}

          {comments.map((c) => (
            <div key={c.id} className="flex gap-2.5">
              <Link
                href={c.user.handle ? `/profile/${c.user.handle}` : "#"}
                className="flex-shrink-0"
              >
                <Avatar
                  displayName={c.user.displayName}
                  avatarUrl={c.user.avatarUrl}
                  size="sm"
                />
              </Link>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-1.5 flex-wrap">
                  <Link
                    href={c.user.handle ? `/profile/${c.user.handle}` : "#"}
                    className="text-xs font-bold text-[#0d3c54] hover:underline"
                  >
                    {c.user.displayName ?? c.user.handle ?? "Someone"}
                  </Link>
                  <span className="text-[10px] text-gray-400">{timeAgo(c.createdAt)}</span>
                </div>
                <p className="text-sm text-black leading-relaxed mt-0.5">{c.body}</p>
              </div>
            </div>
          ))}

          {hasMore && (
            <button
              type="button"
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="text-xs font-bold text-[#551904] text-left w-fit"
            >
              {loadingMore ? <span className="flex items-center gap-1.5">Loading <LoadingDots /></span> : "Load more comments"}
            </button>
          )}

          {/* Input */}
          <form onSubmit={handleSubmit} className="flex items-center gap-2 mt-1">
            <input
              type="text"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Add a comment..."
              maxLength={1000}
              className="flex-1 rounded-full border border-gray-200 bg-white px-3 py-2 text-base text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0d3c54] transition"
            />
            <button
              type="submit"
              disabled={!body.trim() || submitting}
              className="text-[#0d3c54] disabled:text-gray-300 transition-colors flex-shrink-0"
              aria-label="Post comment"
            >
              {submitting ? <LoadingDots /> : <Send size={16} />}
            </button>
          </form>

          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
      )}
    </div>
  );
}
