"use client";

import { useState } from "react";
import { toggleFollow } from "@/lib/actions/follow";

interface FollowButtonProps {
  targetUserId: string;
  initialFollowing: boolean;
}

export default function FollowButton({
  targetUserId,
  initialFollowing,
}: FollowButtonProps) {
  const [following, setFollowing] = useState(initialFollowing);
  const [pending, setPending] = useState(false);

  async function handleToggle() {
    if (pending) return;
    const next = !following;
    setFollowing(next);
    setPending(true);

    const result = await toggleFollow({ targetUserId });
    setPending(false);

    if ("error" in result) {
      setFollowing(!next);
    }
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      className={`rounded-full px-4 py-1.5 text-xs font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0d3c54] focus-visible:ring-offset-2 ${
        following
          ? "bg-white border border-gray-200 text-[#0d3c54] hover:border-[#0d3c54]/40"
          : "bg-[#0d3c54] text-white hover:bg-[#0a2f42]"
      }`}
      aria-label={following ? "Unfollow" : "Follow"}
    >
      {following ? "Following" : "Follow"}
    </button>
  );
}
