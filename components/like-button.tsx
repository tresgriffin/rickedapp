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
  const [error, setError] = useState("");

  async function handleToggle() {
    if (pending) return;
    const next = !liked;
    setLiked(next);
    setCount((c) => (next ? c + 1 : c - 1));
    setPending(true);

    const result = await toggleLike({ targetType, targetId });
    setPending(false);

    if ("error" in result) {
      setLiked(!next);
      setCount((c) => (next ? c - 1 : c + 1));
      setError("Couldn't save. Try again.");
      setTimeout(() => setError(""), 3000);
    }
  }

  return (
    <div className="flex flex-col gap-0.5">
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
      {error && <span className="text-[10px] text-red-500">{error}</span>}
    </div>
  );
}
