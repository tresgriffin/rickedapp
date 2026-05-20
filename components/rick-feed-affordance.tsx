"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Send, ArrowUp } from "lucide-react";
import RocksGlass from "@/components/icons/rocks-glass";

// Background token — change here to update both expanded and compact states.
const CARD_BG = "bg-[#0d3c54]";

const PLACEHOLDERS = [
  "What are we making tonight?",
  "What's in your bar?",
  "Need something refreshing?",
  "Got a spirit and no plan?",
];

const CHIPS = [
  "What should I make tonight?",
  "Surprise me",
  "I have bourbon",
  "Something refreshing",
];

export default function RickFeedAffordance() {
  const router = useRouter();
  const [isCompact, setIsCompact] = useState(false);
  const [input, setInput] = useState("");
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Rotate input placeholder every 4000ms; pause while focused
  useEffect(() => {
    if (isFocused) return;
    const interval = setInterval(() => {
      setPlaceholderIdx((i) => (i + 1) % PLACEHOLDERS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [isFocused]);

  // Compact mode: fires when the sentinel (bottom edge of expanded card)
  // exits the viewport. IntersectionObserver fires once on mount with
  // current state, so this handles page-already-scrolled correctly.
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsCompact(!entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  function navigate(message: string) {
    const trimmed = message.trim();
    if (!trimmed) return;
    router.push(`/rick?prompt=${encodeURIComponent(trimmed)}`);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      navigate(input);
    }
  }

  return (
    <>
      {/* ── Expanded card — in normal flow, scrolls with page ─────────── */}
      <div className={`${CARD_BG} mx-4 mt-4 mb-2 rounded-2xl p-4 flex flex-col gap-3`}>
        {/* Rick identity */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#551904] flex items-center justify-center flex-shrink-0">
            <RocksGlass size={16} className="text-white" />
          </div>
          <p className="text-sm font-bold text-white leading-snug">
            Chat with Rick: Your AI Mixologist
          </p>
        </div>

        {/* Input */}
        <div className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2.5 focus-within:bg-white/15 transition-colors">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={isFocused ? "" : PLACEHOLDERS[placeholderIdx]}
            aria-label="Chat with Rick"
            className="flex-1 bg-transparent text-sm text-white placeholder-white/50 focus:outline-none min-w-0"
          />
          <button
            type="button"
            onClick={() => navigate(input)}
            disabled={!input.trim()}
            aria-label="Send message to Rick"
            className="text-white/60 hover:text-white transition-colors disabled:opacity-30 flex-shrink-0"
          >
            <Send size={15} />
          </button>
        </div>

        {/* Suggestion chips */}
        <div className="flex flex-wrap gap-2">
          {CHIPS.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => navigate(chip)}
              className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/20 transition-colors"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Sentinel — its intersection state drives isCompact */}
        <div ref={sentinelRef} aria-hidden="true" />
      </div>

      {/* ── Compact bar — fixed, fades in once expanded scrolls away ─── */}
      {/* Renders in DOM always so the observer keeps working; hidden via opacity */}
      <div
        role="region"
        aria-label="Rick chat shortcut"
        aria-hidden={!isCompact}
        className={`fixed top-14 left-0 right-0 z-20 ${CARD_BG} px-4 py-2 shadow-sm motion-safe:transition-opacity motion-safe:duration-200 ${
          isCompact ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-2">
          {/* Avatar */}
          <div className="w-5 h-5 rounded-full bg-[#551904] flex items-center justify-center flex-shrink-0">
            <RocksGlass size={10} className="text-white" />
          </div>

          {/* Tap-to-open affordance styled as placeholder text */}
          <button
            type="button"
            tabIndex={isCompact ? 0 : -1}
            onClick={() => router.push("/rick")}
            aria-label="Open Rick chat"
            className="flex-1 text-left text-sm text-white/50 focus:outline-none"
          >
            Chat with Rick
          </button>

          {/* Send — navigates to Rick chat */}
          <button
            type="button"
            tabIndex={isCompact ? 0 : -1}
            onClick={() => router.push("/rick")}
            aria-label="Open Rick chat"
            className="text-white/50 hover:text-white transition-colors flex-shrink-0"
          >
            <Send size={14} />
          </button>

          {/* Scroll to top */}
          <button
            type="button"
            tabIndex={isCompact ? 0 : -1}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            aria-label="Scroll to top"
            className="text-white/50 hover:text-white transition-colors flex-shrink-0"
          >
            <ArrowUp size={14} />
          </button>
        </div>
      </div>
    </>
  );
}
