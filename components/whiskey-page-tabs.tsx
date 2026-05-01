"use client";

import { useState } from "react";
import TabBar from "@/components/tab-bar";
import ReviewCard from "@/components/review-card";
import PostCard from "@/components/post-card";
import EmptyState from "@/components/empty-state";

interface Review {
  id: string;
  rating: number;
  body: string;
  createdAt: Date;
  user: { handle: string | null; displayName: string | null; avatarUrl: string | null };
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
}

interface WhiskeyPageTabsProps {
  reviews: Review[];
  posts: Post[];
  whiskeyName: string;
}

const TABS = [
  { id: "reviews", label: "Reviews" },
  { id: "posts", label: "Photos & Posts" },
];

export default function WhiskeyPageTabs({
  reviews,
  posts,
  whiskeyName,
}: WhiskeyPageTabsProps) {
  const [activeTab, setActiveTab] = useState("reviews");

  return (
    <div>
      <TabBar tabs={TABS} activeId={activeTab} onChange={setActiveTab} />

      <div className="px-4 pt-4 pb-6 flex flex-col gap-3">
        {activeTab === "reviews" &&
          (reviews.length === 0 ? (
            <EmptyState
              message={`No reviews yet for ${whiskeyName}.`}
              sub="You could be the first — what did you think?"
            />
          ) : (
            reviews.map((r) => <ReviewCard key={r.id} review={r} />)
          ))}

        {activeTab === "posts" &&
          (posts.length === 0 ? (
            <EmptyState
              message="No posts about this one yet."
              sub="Pour some and tell people about it."
            />
          ) : (
            posts.map((p) => <PostCard key={p.id} post={p} />)
          ))}
      </div>
    </div>
  );
}
