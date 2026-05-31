"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import TabBar from "@/components/tab-bar";
import Avatar from "@/components/avatar";
import ReviewCard from "@/components/review-card";
import RecipeReviewCard from "@/components/recipe-review-card";
import RecipeCard from "@/components/recipe-card";
import PostCard from "@/components/post-card";
import FollowButton from "@/components/follow-button";
import EmptyState from "@/components/empty-state";
import type { CommentWithUser } from "@/lib/actions/comment";

interface Review {
  id: string;
  rating: number;
  body: string;
  mediaUrl: string | null;
  createdAt: Date;
  user: { handle: string | null; displayName: string | null; avatarUrl: string | null };
  whiskey: { id: string; name: string; brand: string } | null;
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
  initialComments: CommentWithUser[];
}

interface Post {
  id: string;
  userId: string;
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

interface Recipe {
  id: string;
  title: string;
  description: string | null;
  mediaUrl: string | null;
  ingredients: unknown;
  createdAt: Date;
  isAiGenerated: boolean;
  isPublished: boolean;
  taggedWhiskey?: { id: string; name: string; brand: string } | null;
  user: { handle: string | null; displayName: string | null; avatarUrl: string | null };
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
  initialComments: CommentWithUser[];
}

interface RecipeReview {
  id: string;
  rating: number;
  body: string | null;
  createdAt: Date;
  recipe: { id: string; title: string };
}

interface ProfileUser {
  id: string;
  handle: string | null;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  reviews: Review[];
  recipeReviews: RecipeReview[];
  posts: Post[];
  recipes: Recipe[];
  _count: { followers: number; following: number };
}

interface ProfileViewProps {
  user: ProfileUser;
  isOwnProfile: boolean;
  isFollowing: boolean;
  hideReviewsTab?: boolean;
  defaultTab?: string;
  viewerId?: string;
}

type ReviewFilter = "all" | "recipes" | "bottles";

export default function ProfileView({ user, isOwnProfile, isFollowing, hideReviewsTab = false, defaultTab, viewerId }: ProfileViewProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(defaultTab ?? "recipes");
  const [reviewFilter, setReviewFilter] = useState<ReviewFilter>("all");

  const baseUrl = isOwnProfile ? "/profile" : `/profile/${user.handle}`;

  function handleTabChange(tabId: string) {
    setActiveTab(tabId);
    const url = tabId === "recipes" ? baseUrl : `${baseUrl}?tab=${tabId}`;
    router.replace(url, { scroll: false });
  }

  const hasWhiskeyReviews = user.reviews.length > 0;
  const hasRecipeReviews = user.recipeReviews.length > 0;
  const showReviewFilter = hasWhiskeyReviews && hasRecipeReviews;

  const tabs = [
    { id: "recipes", label: "Recipes" },
    { id: "posts", label: "Posts" },
    ...(hideReviewsTab ? [] : [{ id: "reviews", label: "Reviews" }]),
    ...(isOwnProfile ? [{ id: "saved", label: "Saved" }] : []),
  ];

  return (
    <div>
      {/* Profile header */}
      <div className="bg-white border-b border-gray-100 px-4 pt-6 pb-5 flex flex-col gap-4">
        <div className="flex items-start gap-4">
          <Avatar displayName={user.displayName} avatarUrl={user.avatarUrl} size="lg" />

          <div className="flex-1 min-w-0 pt-1">
            <h1 className="font-[family-name:var(--font-abhaya-libre)] text-xl font-bold text-[#0d3c54] leading-tight">
              {user.displayName ?? user.handle ?? "Unknown"}
            </h1>
            <p className="text-sm text-gray-400">@{user.handle}</p>

            <div className="flex gap-5 mt-2">
              <div className="flex flex-col items-center">
                <span className="text-sm font-bold text-[#0d3c54]">
                  {user.recipes.length}
                </span>
                <span className="text-xs text-gray-400">recipes</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-sm font-bold text-[#0d3c54]">
                  {user._count.followers}
                </span>
                <span className="text-xs text-gray-400">followers</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-sm font-bold text-[#0d3c54]">
                  {user._count.following}
                </span>
                <span className="text-xs text-gray-400">following</span>
              </div>
              {!hideReviewsTab && (
                <div className="flex flex-col items-center">
                  <span className="text-sm font-bold text-[#0d3c54]">
                    {user.reviews.length}
                  </span>
                  <span className="text-xs text-gray-400">reviews</span>
                </div>
              )}
            </div>
          </div>

          {/* Action button */}
          <div className="flex-shrink-0">
            {isOwnProfile ? (
              <Link
                href="/profile/edit"
                className="rounded-full border border-[#0d3c54] px-4 py-1.5 text-xs font-bold text-[#0d3c54] hover:bg-[#0d3c54]/5 transition-colors"
              >
                Edit profile
              </Link>
            ) : (
              <FollowButton
                targetUserId={user.id}
                initialFollowing={isFollowing}
              />
            )}
          </div>
        </div>

        {user.bio && (
          <p className="text-sm text-gray-600 leading-relaxed">{user.bio}</p>
        )}
      </div>

      {/* Tabs */}
      <TabBar tabs={tabs} activeId={activeTab} onChange={handleTabChange} />

      <div className="px-4 pt-4 pb-6 flex flex-col gap-3">
        {activeTab === "reviews" && (() => {
          const noReviews = !hasWhiskeyReviews && !hasRecipeReviews;
          if (noReviews) {
            return (
              <EmptyState
                message={isOwnProfile ? "You haven't reviewed anything yet." : "Nothing reviewed yet."}
                sub={isOwnProfile ? "Find a recipe or bottle you've tried. Tell us what you think." : "Check back later."}
              />
            );
          }

          const showWhiskey = reviewFilter === "all" || reviewFilter === "bottles";
          const showRecipe = reviewFilter === "all" || reviewFilter === "recipes";

          const merged = [
            ...(showWhiskey ? user.reviews.map((r) => ({ type: "whiskey" as const, id: r.id, createdAt: new Date(r.createdAt), data: r })) : []),
            ...(showRecipe ? user.recipeReviews.map((r) => ({ type: "recipe" as const, id: r.id, createdAt: new Date(r.createdAt), data: r })) : []),
          ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

          return (
            <>
              {showReviewFilter && (
                <div className="flex gap-2 mb-1">
                  {(["all", "recipes", "bottles"] as ReviewFilter[]).map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setReviewFilter(f)}
                      className={`rounded-full px-3 py-1 text-xs font-bold border transition-colors ${
                        reviewFilter === f
                          ? "bg-[#0d3c54] border-[#0d3c54] text-white"
                          : "border-gray-200 text-gray-500 hover:border-[#0d3c54]/40"
                      }`}
                    >
                      {f === "all" ? "All" : f === "recipes" ? "Recipes" : "Bottles"}
                    </button>
                  ))}
                </div>
              )}
              {merged.map((item) =>
                item.type === "whiskey" ? (
                  <ReviewCard
                    key={`w-${item.id}`}
                    review={item.data}
                    isLiked={item.data.isLiked}
                    initialComments={item.data.initialComments}
                  />
                ) : (
                  <RecipeReviewCard key={`r-${item.id}`} review={item.data} />
                )
              )}
            </>
          );
        })()}

        {activeTab === "posts" &&
          (user.posts.length === 0 ? (
            <EmptyState
              message={isOwnProfile ? "No posts yet." : "Nothing posted yet."}
              sub={isOwnProfile ? "Pour one and tell us about it." : "Check back later."}
            />
          ) : (
            user.posts.map((p) => (
              <PostCard
                key={p.id}
                post={p}
                isLiked={p.isLiked}
                initialComments={p.initialComments}
                viewerId={isOwnProfile ? user.id : undefined}
                returnHref={`${baseUrl}?tab=posts`}
              />
            ))
          ))}

        {activeTab === "recipes" &&
          (user.recipes.length === 0 ? (
            <EmptyState
              message={isOwnProfile ? "No recipes yet." : "No recipes shared yet."}
              sub={
                isOwnProfile
                  ? "Got a good Old Fashioned recipe? Share it."
                  : "Check back later."
              }
            />
          ) : (
            user.recipes.map((r) =>
              r.isAiGenerated && !r.isPublished ? (
                // Unpublished AI draft — compact card linking to the publish flow
                <Link
                  key={r.id}
                  href={`/recipe/${r.id}/publish`}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col gap-1 hover:border-[#0d3c54]/20 transition-colors active:scale-[0.98]"
                >
                  <span className="self-start inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-100 rounded-full px-2 py-0.5">
                    ✦ Rick draft · Tap to publish
                  </span>
                  <p className="text-sm font-bold text-[#0d3c54]">{r.title}</p>
                </Link>
              ) : (
                // Published recipe — full RecipeCard with social affordances
                <RecipeCard
                  key={r.id}
                  recipe={r}
                  isLiked={r.isLiked}
                  initialComments={r.initialComments as Parameters<typeof RecipeCard>[0]["initialComments"]}
                  viewerId={viewerId}
                />
              )
            )
          ))}

        {activeTab === "saved" && (
          <EmptyState
            message="Saved is coming soon."
            sub="When it lands, you'll be able to bookmark bottles, recipes, and posts to find them later."
          />
        )}

      </div>
    </div>
  );
}
