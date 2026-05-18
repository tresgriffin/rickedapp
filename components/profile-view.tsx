"use client";

import { useState } from "react";
import Link from "next/link";
import TabBar from "@/components/tab-bar";
import Avatar from "@/components/avatar";
import ReviewCard from "@/components/review-card";
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
  ingredients: unknown;
  createdAt: Date;
  isAiGenerated: boolean;
  isPublished: boolean;
  taggedWhiskey?: { id: string; name: string; brand: string } | null;
}

interface ProfileUser {
  id: string;
  handle: string | null;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  reviews: Review[];
  posts: Post[];
  recipes: Recipe[];
  _count: { followers: number; following: number };
}

interface ProfileViewProps {
  user: ProfileUser;
  isOwnProfile: boolean;
  isFollowing: boolean;
}

export default function ProfileView({ user, isOwnProfile, isFollowing }: ProfileViewProps) {
  const [activeTab, setActiveTab] = useState("recipes");

  const tabs = [
    { id: "recipes", label: "Recipes" },
    { id: "posts", label: "Posts" },
    { id: "reviews", label: "Reviews" },
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
              <div className="flex flex-col items-center">
                <span className="text-sm font-bold text-[#0d3c54]">
                  {user.reviews.length}
                </span>
                <span className="text-xs text-gray-400">reviews</span>
              </div>
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
      <TabBar tabs={tabs} activeId={activeTab} onChange={setActiveTab} />

      <div className="px-4 pt-4 pb-6 flex flex-col gap-3">
        {activeTab === "reviews" &&
          (user.reviews.length === 0 ? (
            <EmptyState
              message={
                isOwnProfile
                  ? "You haven't reviewed anything yet."
                  : "Nothing reviewed yet."
              }
              sub={
                isOwnProfile
                  ? "Find a bottle you've had. Tell us what you think."
                  : "Check back later."
              }
            />
          ) : (
            user.reviews.map((r) => (
              <ReviewCard
                key={r.id}
                review={r}
                isLiked={r.isLiked}
                initialComments={r.initialComments}
              />
            ))
          ))}

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
            user.recipes.map((r) => (
              <Link
                key={r.id}
                href={r.isAiGenerated && !r.isPublished ? `/recipe/${r.id}/publish` : `/recipe/${r.id}`}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col gap-1 hover:border-[#0d3c54]/20 transition-colors active:scale-[0.98]"
              >
                <div className="flex items-start gap-2 flex-wrap">
                  {r.taggedWhiskey && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#551904] bg-[#551904]/8 rounded-full px-2 py-0.5">
                      🥃 {r.taggedWhiskey.name}
                    </span>
                  )}
                  {r.isAiGenerated && !r.isPublished && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-100 rounded-full px-2 py-0.5">
                      ✦ Rick draft · Tap to publish
                    </span>
                  )}
                  {r.isAiGenerated && r.isPublished && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0d3c54] bg-[#0d3c54]/8 rounded-full px-2 py-0.5">
                      ✦ by Rick
                    </span>
                  )}
                </div>
                <p className="text-sm font-bold text-[#0d3c54]">{r.title}</p>
                {r.description && (
                  <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
                    {r.description}
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  {Array.isArray(r.ingredients) ? r.ingredients.length : 0} ingredients
                </p>
              </Link>
            ))
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
