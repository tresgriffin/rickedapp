"use client";

import { useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";

export default function CompleteProfileNudge() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div className="mx-4 mt-4 mb-1 bg-[#0d3c54]/6 border border-[#0d3c54]/12 rounded-2xl px-4 py-3 flex items-start gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-sm text-[#0d3c54]">
          <span className="font-bold">Finish your profile.</span>{" "}
          Add a photo and a bio so people know it&apos;s you.
        </p>
        <Link
          href="/profile/edit"
          className="mt-1 inline-block text-xs font-bold text-[#551904] hover:underline"
        >
          Complete profile →
        </Link>
      </div>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        className="text-[#0d3c54]/40 hover:text-[#0d3c54]/70 transition-colors flex-shrink-0"
      >
        <X size={16} />
      </button>
    </div>
  );
}
