"use client";

import { useState } from "react";
import { toggleFollow } from "@/lib/actions/follow";
import VerificationNudge from "@/components/verification-nudge";

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
  const [error, setError] = useState("");
  const [verificationBlocked, setVerificationBlocked] = useState(false);

  async function handleToggle() {
    if (pending) return;
    const next = !following;
    setFollowing(next);
    setPending(true);

    const result = await toggleFollow({ targetUserId });
    setPending(false);

    if ("error" in result) {
      setFollowing(!next);
      if (result.error.toLowerCase().includes("verify")) {
        setVerificationBlocked(true);
      } else {
        setError("Couldn't save. Try again.");
        setTimeout(() => setError(""), 3000);
      }
    }
  }

  return (
    <div className="flex flex-col items-end gap-0.5">
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
      {verificationBlocked && <VerificationNudge toast />}
      {error && <span className="text-[10px] text-red-500">{error}</span>}
    </div>
  );
}
