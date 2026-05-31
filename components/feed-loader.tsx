"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import PostCard from "@/components/post-card";
import RecipeCard from "@/components/recipe-card";
import LoadingDots from "@/components/loading-dots";
import type { CommentWithUser } from "@/lib/actions/comment";
import type { RecipeRatingStats } from "@/lib/recipe-rating-stats";

// JSON-serialized shapes from /api/feed (dates are ISO strings, not Date objects)
type FeedPostItem = {
  kind: "post";
  item: {
    id: string;
    userId: string;
    body: string;
    createdAt: string;
    mediaUrl: string | null;
    user: { handle: string | null; displayName: string | null; avatarUrl: string | null };
    taggedWhiskey: { id: string; name: string; brand: string } | null;
    likeCount: number;
    commentCount: number;
  };
  isLiked: boolean;
  initialComments: CommentWithUser[];
};

type FeedRecipeItem = {
  kind: "recipe";
  item: {
    id: string;
    title: string;
    mediaUrl: string | null;
    ingredients: unknown;
    createdAt: string;
    isAiGenerated: boolean;
    user: { handle: string | null; displayName: string | null; avatarUrl: string | null };
    taggedWhiskey: { id: string; name: string; brand: string } | null;
    likeCount: number;
    commentCount: number;
  };
  isLiked: boolean;
  initialComments: CommentWithUser[];
  ratingStats: RecipeRatingStats | null;
};

type FeedItem = FeedPostItem | FeedRecipeItem;

interface FeedLoaderProps {
  initialCursorDate: string | null;
  initialCursorId: string | null;
  viewerId: string;
  initialHasMore: boolean;
}

export default function FeedLoader({
  initialCursorDate,
  initialCursorId,
  viewerId,
  initialHasMore,
}: FeedLoaderProps) {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [cursorDate, setCursorDate] = useState(initialCursorDate);
  const [cursorId, setCursorId] = useState(initialCursorId);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);

  const sentinelRef = useRef<HTMLDivElement>(null);
  const inFlightRef = useRef(false);
  // Stable ref so the observer callback reads current values without re-creating
  const stateRef = useRef({ hasMore: initialHasMore, loading: false, cursorDate: initialCursorDate, cursorId: initialCursorId });
  stateRef.current = { hasMore, loading, cursorDate, cursorId };

  const fetchMore = useCallback(async () => {
    const { hasMore, loading, cursorDate, cursorId } = stateRef.current;
    if (!hasMore || loading || inFlightRef.current || !cursorDate || !cursorId) return;

    inFlightRef.current = true;
    setLoading(true);
    try {
      const params = new URLSearchParams({ cursorDate, cursorId, pageSize: "20" });
      const res = await fetch(`/api/feed?${params}`);
      if (!res.ok) throw new Error(`Feed fetch ${res.status}`);
      const data = await res.json();
      setItems((prev) => [...prev, ...data.items]);
      setCursorDate(data.nextCursorDate);
      setCursorId(data.nextCursorId);
      setHasMore(data.hasMore);
    } catch {
      // Fail silently — feed is still functional, user can scroll up/retry
    } finally {
      setLoading(false);
      inFlightRef.current = false;
    }
  }, []);

  // Intersection observer — created once, reads current state from ref
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !initialHasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) fetchMore();
      },
      { rootMargin: "200px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [fetchMore, initialHasMore]);

  // Nothing to load — render nothing and don't observe
  if (!initialHasMore) return null;

  return (
    <>
      {items.length > 0 && (
        <div className="flex flex-col gap-3">
          {items.map((entry) => {
            const mapKey = `${entry.kind.toUpperCase()}:${entry.item.id}`;
            // Convert ISO string dates back to Date objects for card components.
            // timeAgo() accepts Date|string, but the card interfaces expect Date.
            const createdAt = new Date(entry.item.createdAt);

            if (entry.kind === "post") {
              return (
                <PostCard
                  key={mapKey}
                  post={{ ...entry.item, createdAt }}
                  isLiked={entry.isLiked}
                  initialComments={
                    entry.initialComments as Parameters<typeof PostCard>[0]["initialComments"]
                  }
                  viewerId={viewerId}
                  returnHref="/home"
                />
              );
            }

            return (
              <RecipeCard
                key={mapKey}
                recipe={{ ...entry.item, createdAt }}
                isLiked={entry.isLiked}
                initialComments={
                  entry.initialComments as Parameters<typeof RecipeCard>[0]["initialComments"]
                }
                ratingStats={entry.ratingStats}
                viewerId={viewerId}
              />
            );
          })}
        </div>
      )}

      {/* Sentinel triggers fetchMore when it enters the viewport */}
      <div ref={sentinelRef} />

      {loading && (
        <div className="flex items-center justify-center gap-2 py-4 text-sm text-gray-400">
          Loading <LoadingDots />
        </div>
      )}

      {!hasMore && items.length > 0 && (
        <p className="py-6 text-center text-xs text-gray-300">You&apos;re all caught up.</p>
      )}
    </>
  );
}
