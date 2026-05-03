"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import TabBar from "@/components/tab-bar";
import ReviewCard from "@/components/review-card";
import PostCard from "@/components/post-card";
import EmptyState from "@/components/empty-state";
import StarRating from "@/components/star-rating";
import Avatar from "@/components/avatar";
import { timeAgo } from "@/lib/format";
import type { CommentWithUser } from "@/lib/actions/comment";

interface Review {
  id: string;
  rating: number;
  body: string;
  mediaUrl: string | null;
  createdAt: Date;
  user: { handle: string | null; displayName: string | null; avatarUrl: string | null };
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
  initialComments: CommentWithUser[];
}

interface Post {
  id: string;
  body: string;
  createdAt: Date;
  mediaUrl: string | null;
  user: { handle: string | null; displayName: string | null; avatarUrl: string | null };
  taggedWhiskey: { id: string; name: string; brand: string } | null;
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
  initialComments: CommentWithUser[];
}

interface RecipeResult {
  id: string;
  title: string;
  description: string | null;
  mediaUrl: string | null;
  ingredientCount: number;
  createdAt: Date;
  avgStars: number | null;
  wouldMakeAgainPct: number | null;
  ratingCount: number;
  user: { handle: string | null; displayName: string | null; avatarUrl: string | null };
}

interface WhiskeyPageTabsProps {
  whiskeyId: string;
  whiskeyName: string;
  reviews: Review[];
  posts: Post[];
}

const TABS = [
  { id: "recipes", label: "Recipes" },
  { id: "reviews", label: "Reviews" },
  { id: "posts", label: "Photos & Posts" },
];

type SortBy = "recent" | "stars" | "thumbs";

export default function WhiskeyPageTabs({
  whiskeyId,
  whiskeyName,
  reviews,
  posts,
}: WhiskeyPageTabsProps) {
  const [activeTab, setActiveTab] = useState("recipes");
  const [recipes, setRecipes] = useState<RecipeResult[]>([]);
  const [recipeSort, setRecipeSort] = useState<SortBy>("recent");
  const [recipesLoaded, setRecipesLoaded] = useState(false);

  // Lazy-load recipes when the tab is first activated (no synchronous setState in body)
  useEffect(() => {
    if (activeTab !== "recipes" || recipesLoaded) return;
    fetch(`/api/recipes?whiskeyId=${whiskeyId}&pageSize=30`)
      .then((r) => r.json())
      .then((json) => { setRecipes(json.data ?? []); setRecipesLoaded(true); })
      .catch(() => setRecipesLoaded(true));
  }, [activeTab, whiskeyId, recipesLoaded]);

  const sortedRecipes = [...recipes].sort((a, b) => {
    if (recipeSort === "stars") return (b.avgStars ?? -1) - (a.avgStars ?? -1);
    if (recipeSort === "thumbs") return (b.wouldMakeAgainPct ?? -1) - (a.wouldMakeAgainPct ?? -1);
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div>
      <TabBar tabs={TABS} activeId={activeTab} onChange={setActiveTab} />

      <div className="px-4 pt-4 pb-6 flex flex-col gap-3">

        {/* ── Recipes tab ───────────────────────────────────────────────── */}
        {activeTab === "recipes" && (
          <>
            {!recipesLoaded && (
              <p className="text-sm text-gray-400 py-8 text-center">Loading recipes…</p>
            )}

            {recipesLoaded && sortedRecipes.length === 0 && (
              <EmptyState
                message={`No recipes with ${whiskeyName} yet.`}
                sub="That's a gap worth filling."
              >
                <Link
                  href={`/recipe/new?whiskeyId=${whiskeyId}`}
                  className="mt-2 inline-block rounded-full bg-[#0d3c54] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#0a2f42] transition-colors"
                >
                  Add a recipe
                </Link>
              </EmptyState>
            )}

            {recipesLoaded && sortedRecipes.length > 0 && (
              <>
                {/* Sort controls */}
                <div className="flex gap-2 flex-wrap">
                  {(["recent", "stars", "thumbs"] as SortBy[]).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setRecipeSort(s)}
                      className={`rounded-full px-3 py-1 text-xs font-bold transition-colors ${
                        recipeSort === s
                          ? "bg-[#0d3c54] text-white"
                          : "bg-white border border-gray-200 text-gray-500 hover:border-[#0d3c54]/30"
                      }`}
                    >
                      {s === "recent" ? "Recent" : s === "stars" ? "Best rated" : "Most made"}
                    </button>
                  ))}
                </div>

                {/* FUTURE: surface ingredient-matching (v1.1) if tagging adoption proves low */}
                {sortedRecipes.map((r) => (
                  <Link
                    key={r.id}
                    href={`/recipe/${r.id}`}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col gap-2 hover:border-[#0d3c54]/20 transition-colors active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-2">
                      <Avatar
                        displayName={r.user.displayName}
                        avatarUrl={r.user.avatarUrl}
                        size="sm"
                      />
                      <span className="text-xs text-gray-400">
                        {r.user.displayName ?? r.user.handle} · {timeAgo(r.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-[#0d3c54]">{r.title}</p>
                    {r.description && (
                      <p className="text-xs text-gray-500 line-clamp-2">{r.description}</p>
                    )}
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-[11px] font-bold uppercase tracking-wide text-[#551904] bg-[#551904]/8 rounded-full px-2 py-0.5">
                        {r.ingredientCount} ingredient{r.ingredientCount === 1 ? "" : "s"}
                      </span>
                      {r.avgStars != null && r.ratingCount > 0 && (
                        <div className="flex items-center gap-1">
                          <StarRating rating={r.avgStars} size="sm" showValue />
                        </div>
                      )}
                      {r.wouldMakeAgainPct != null && r.ratingCount > 0 && (
                        <span className="text-xs text-gray-500">{r.wouldMakeAgainPct}% 👍</span>
                      )}
                    </div>
                  </Link>
                ))}
              </>
            )}
          </>
        )}

        {/* ── Reviews tab ───────────────────────────────────────────────── */}
        {activeTab === "reviews" &&
          (reviews.length === 0 ? (
            <EmptyState
              message={`No reviews yet for ${whiskeyName}.`}
              sub="You could be the first. What did you think?"
            />
          ) : (
            reviews.map((r) => (
              <ReviewCard
                key={r.id}
                review={r}
                isLiked={r.isLiked}
                initialComments={r.initialComments}
              />
            ))
          ))}

        {/* ── Photos & Posts tab ─────────────────────────────────────────── */}
        {activeTab === "posts" &&
          (posts.length === 0 ? (
            <EmptyState
              message="No posts about this one yet."
              sub="Pour some and tell people about it."
            />
          ) : (
            posts.map((p) => (
              <PostCard
                key={p.id}
                post={p}
                isLiked={p.isLiked}
                initialComments={p.initialComments}
              />
            ))
          ))}
      </div>
    </div>
  );
}
