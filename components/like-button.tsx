"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { toggleLike } from "@/lib/actions/like";
import type { LikeTargetType } from "@/app/generated/prisma/client";

interface LikeButtonProps {
  targetType: LikeTargetType;
  targetId: string;
  initialLiked: boolean;
  initialCount: number;
}

export default function LikeButton({
  targetType,
  targetId,
  initialLiked,
  initialCount,
}: LikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [pending, setPending] = useState(false);

  async function handleToggle() {
    if (pending) return;
    const next = !liked;
    setLiked(next);
    setCount((c) => (next ? c + 1 : c - 1));
    setPending(true);

    const result = await toggleLike({ targetType, targetId });
    setPending(false);

    if ("error" in result) {
      // Roll back on failure
      setLiked(!next);
      setCount((c) => (next ? c - 1 : c + 1));
    }
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      className={`flex items-center gap-1.5 transition-colors ${
        liked ? "text-[#551904]" : "text-gray-400 hover:text-[#551904]"
      }`}
      aria-label={`${count} ${count === 1 ? "like" : "likes"}${liked ? ", liked" : ""}`}
    >
      <Heart
        size={16}
        strokeWidth={liked ? 0 : 1.5}
        fill={liked ? "#551904" : "none"}
      />
      <span className="text-xs font-medium">{count}</span>
    </button>
  );
}
