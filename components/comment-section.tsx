"use client";

// Thread-only component — no toggle, no count state. Those live in the parent
// (PostCard / RecipeCard) so the action row owns a single source of truth for count
// and can render [♡ count] [💬 count] side by side with the thread below.

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Send, X } from "lucide-react";
import Avatar from "@/components/avatar";
import LoadingDots from "@/components/loading-dots";
import { addComment, deleteComment, type CommentWithUser } from "@/lib/actions/comment";
import { timeAgo } from "@/lib/format";
import type { LikeTargetType } from "@/app/generated/prisma/client";

interface CommentSectionProps {
  targetType: LikeTargetType;
  targetId: string;
  initialComments: CommentWithUser[];
  initialCount: number;
  expanded: boolean;
  viewerId?: string;
  onCommentAdded: () => void;
  onCommentDeleted: () => void;
}

export default function CommentSection({
  targetType,
  targetId,
  initialComments,
  initialCount,
  expanded,
  viewerId,
  onCommentAdded,
  onCommentDeleted,
}: CommentSectionProps) {
  const [comments, setComments] = useState<CommentWithUser[]>(initialComments);
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [hasMore, setHasMore] = useState(initialCount > initialComments.length);
  const [error, setError] = useState("");
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const pendingDeleteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (pendingDeleteTimerRef.current) clearTimeout(pendingDeleteTimerRef.current);
    };
  }, []);

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
    onCommentAdded();
    setBody("");
  }

  async function handleLoadMore() {
    setLoadingMore(true);
    setLoadError("");
    try {
      const res = await fetch(
        `/api/comments?targetType=${targetType}&targetId=${targetId}&offset=${comments.length}`
      );
      if (!res.ok) throw new Error("load failed");
      const json = await res.json();
      setComments((prev) => [...prev, ...(json.data ?? [])]);
      setHasMore(json.meta?.hasMore ?? false);
    } catch {
      setLoadError("Couldn't load comments. Tap to try again.");
    } finally {
      setLoadingMore(false);
    }
  }

  function handleDeleteTap(commentId: string) {
    if (pendingDeleteId === commentId) {
      if (pendingDeleteTimerRef.current) clearTimeout(pendingDeleteTimerRef.current);
      setPendingDeleteId(null);
      void (async () => {
        const result = await deleteComment({ commentId });
        if ("ok" in result) {
          setComments((prev) => prev.filter((c) => c.id !== commentId));
          onCommentDeleted();
        }
      })();
    } else {
      if (pendingDeleteTimerRef.current) clearTimeout(pendingDeleteTimerRef.current);
      setPendingDeleteId(commentId);
      pendingDeleteTimerRef.current = setTimeout(() => setPendingDeleteId(null), 3000);
    }
  }

  if (!expanded) return null;

  return (
    <div className="mt-3 pt-3 border-t border-gray-100 flex flex-col gap-3">
      {comments.length === 0 && (
        <p className="text-xs text-gray-400">No comments yet. Be the first.</p>
      )}

      {comments.map((c) => (
        <div key={c.id} className="flex gap-2.5">
          <Link
            href={c.user.handle ? `/profile/${c.user.handle}` : "#"}
            className="flex-shrink-0"
          >
            <Avatar displayName={c.user.displayName} avatarUrl={c.user.avatarUrl} size="sm" />
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
          {viewerId && c.userId === viewerId && (
            <button
              type="button"
              onClick={() => handleDeleteTap(c.id)}
              className={`flex-shrink-0 self-start mt-0.5 text-[10px] font-bold transition-colors ${
                pendingDeleteId === c.id
                  ? "text-red-500"
                  : "text-gray-300 hover:text-red-400"
              }`}
              aria-label={pendingDeleteId === c.id ? "Confirm delete" : "Delete comment"}
            >
              {pendingDeleteId === c.id ? "Delete?" : <X size={11} />}
            </button>
          )}
        </div>
      ))}

      {hasMore && (
        <div className="flex flex-col gap-0.5">
          <button
            type="button"
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="text-xs font-bold text-[#551904] text-left w-fit"
          >
            {loadingMore ? (
              <span className="flex items-center gap-1.5">
                Loading <LoadingDots />
              </span>
            ) : (
              "Load more comments"
            )}
          </button>
          {loadError && <p className="text-[10px] text-red-500">{loadError}</p>}
        </div>
      )}

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
  );
}
