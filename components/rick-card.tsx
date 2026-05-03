"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import RocksGlass from "@/components/icons/rocks-glass";

const HEADLINES = [
  "What are we making tonight?",
  "What's in your bar?",
  "Need something refreshing?",
  "Got a spirit and no plan?",
];

const CHIPS = [
  { label: "I have Buffalo Trace", prompt: "I have Buffalo Trace" },
  { label: "Surprise me", prompt: "Surprise me" },
  { label: "Something refreshing", prompt: "Something refreshing" },
  { label: "Help with my recipe", prompt: "Help with my recipe" },
];

export default function RickCard() {
  const [dismissed, setDismissed] = useState(false);
  const [headlineIndex, setHeadlineIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setHeadlineIndex((i) => (i + 1) % HEADLINES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  if (dismissed) return null;

  return (
    <div className="mx-4 bg-[#0d3c54] rounded-2xl p-4 flex flex-col gap-3 relative">
      {/* Dismiss */}
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        className="absolute top-3 right-3 text-white/40 hover:text-white/70 transition-colors"
      >
        <X size={14} />
      </button>

      {/* Rick identity */}
      <div className="flex items-center gap-2 pr-6">
        <div className="w-8 h-8 rounded-full bg-[#551904] flex items-center justify-center flex-shrink-0">
          <RocksGlass size={16} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-white leading-none">Rick</p>
          <p className="text-[10px] text-white/50 leading-none mt-0.5">AI mixologist</p>
        </div>
      </div>

      {/* Rotating headline */}
      <p className="text-sm text-white/80 font-medium">
        {HEADLINES[headlineIndex]}
      </p>

      {/* Suggestion chips — all four always visible */}
      <div className="flex flex-wrap gap-2">
        {CHIPS.map(({ label, prompt }) => (
          <Link
            key={label}
            href={`/rick?prompt=${encodeURIComponent(prompt)}`}
            className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/20 transition-colors"
          >
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}
