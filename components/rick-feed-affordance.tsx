"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Send, ArrowUp } from "lucide-react";
import RocksGlass from "@/components/icons/rocks-glass";

// ─── Theme tokens ─────────────────────────────────────────────────────────────
// Cream/light variant (active). To restore dark navy, swap each block:
//   card:         "bg-[#0d3c54]"
//   compactBar:   "bg-[#0d3c54] border-b border-white/10"
//   inputBg:      "bg-white/10 focus-within:bg-white/15"
//   chipBg:       "bg-white/10 hover:bg-white/20"
//   headlineText: "text-white"
//   subheadText:  "text-white/60"
//   inputText:    "text-white placeholder-white/50"
//   iconColor:    "text-white/60 hover:text-white"
const THEME = {
  card:         "bg-white border border-gray-200 shadow-sm",
  compactBar:   "bg-white border-b border-gray-100",
  inputBg:      "bg-[#0d3c54]/6 focus-within:bg-[#0d3c54]/10",
  chipBg:       "bg-[#0d3c54]/8 hover:bg-[#0d3c54]/15",
  headlineText: "text-[#0d3c54]",
  subheadText:  "text-[#0d3c54]/60",
  inputText:    "text-[#0d3c54] placeholder-[#0d3c54]/40",
  iconColor:    "text-[#0d3c54]/50 hover:text-[#0d3c54]",
};

const PLACEHOLDERS = [
  "What are we making tonight?",
  "What's in your bar?",
  "Need something refreshing?",
  "Got a spirit and no plan?",
];

// Brand-neutral chips — intent patterns, no specific products or brands
const CHIPS = [
  "What should I make tonight?",
  "Surprise me",
  "I have bourbon",
  "Something refreshing",
];

export default function RickFeedAffordance() {
  const router = useRouter();
  const [isCompact, setIsCompact] = useState(false);
  const [expandedInput, setExpandedInput] = useState("");
  const [compactInput, setCompactInput] = useState("");
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [expandedFocused, setExpandedFocused] = useState(false);
  const [compactFocused, setCompactFocused] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const compactInputRef = useRef<HTMLInputElement>(null);

  const anyFocused = expandedFocused || compactFocused;

  // Rotate placeholder every 4000ms; pause while any input is focused
  useEffect(() => {
    if (anyFocused) return;
    const interval = setInterval(() => {
      setPlaceholderIdx((i) => (i + 1) % PLACEHOLDERS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [anyFocused]);

  // Compact mode fires when sentinel scrolls out of view.
  // IntersectionObserver fires on mount with current state,
  // so a page-already-scrolled state is handled correctly.
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

  // Custom input submit → auto-sends on /rick (?prompt= triggers auto-send)
  function submitExpanded() {
    const trimmed = expandedInput.trim();
    if (!trimmed) return;
    router.push(`/rick?prompt=${encodeURIComponent(trimmed)}`);
  }

  // Chip tap → fills input on /rick, no auto-send (?prefill= does not trigger auto-send)
  function submitChip(chip: string) {
    router.push(`/rick?prefill=${encodeURIComponent(chip)}`);
  }

  // Compact submit → auto-sends on /rick (same intent signal as custom input)
  function submitCompact() {
    const trimmed = compactInput.trim();
    if (!trimmed) return;
    router.push(`/rick?prompt=${encodeURIComponent(trimmed)}`);
  }

  return (
    <>
      {/* ── Expanded card — in normal page flow, scrolls with page ──────── */}
      <div className={`${THEME.card} mx-4 mt-4 mb-2 rounded-2xl p-4 flex flex-col gap-3`}>
        {/* Rick identity */}
        <div className="flex items-center gap-2.5">
          {/* Avatar sized to match feed post card user avatars (w-10 h-10) */}
          <div className="w-10 h-10 rounded-full bg-[#551904] flex items-center justify-center flex-shrink-0">
            <RocksGlass size={20} className="text-white" />
          </div>
          <div>
            <p className={`text-base font-bold leading-tight ${THEME.headlineText}`}>
              Chat with Rick
            </p>
            <p className={`text-xs leading-snug ${THEME.subheadText}`}>
              Your AI Mixologist
            </p>
          </div>
        </div>

        {/* Input — text-[16px] prevents iOS Safari keyboard zoom */}
        <div className={`flex items-center gap-2 rounded-full px-4 py-2.5 transition-colors ${THEME.inputBg}`}>
          <input
            type="text"
            value={expandedInput}
            onChange={(e) => setExpandedInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); submitExpanded(); } }}
            onFocus={() => setExpandedFocused(true)}
            onBlur={() => setExpandedFocused(false)}
            placeholder={expandedFocused ? "" : PLACEHOLDERS[placeholderIdx]}
            aria-label="Chat with Rick"
            className={`flex-1 bg-transparent text-[16px] focus:outline-none min-w-0 ${THEME.inputText}`}
          />
          <button
            type="button"
            onClick={submitExpanded}
            disabled={!expandedInput.trim()}
            aria-label="Send message to Rick"
            className={`flex-shrink-0 transition-colors disabled:opacity-30 ${THEME.iconColor}`}
          >
            <Send size={15} />
          </button>
        </div>

        {/* Chips — single scrollable row, no brand names */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-0.5">
          {CHIPS.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => submitChip(chip)}
              className={`flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${THEME.chipBg} ${THEME.headlineText}`}
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Sentinel — IntersectionObserver anchor */}
        <div ref={sentinelRef} aria-hidden="true" />
      </div>

      {/* ── Compact bar — fixed, z-30 renders over AppBar shadow ─────────── */}
      <div
        role="region"
        aria-label="Rick chat"
        aria-hidden={!isCompact}
        className={`fixed top-[55px] left-0 right-0 z-30 px-4 py-2 motion-safe:transition-opacity motion-safe:duration-200 ${THEME.compactBar} ${
          isCompact ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="flex items-center gap-2">
          {/* Avatar — outside the pill, sized to match pill height (w-10 h-10 ≈ 40px) */}
          <div className="w-10 h-10 rounded-full bg-[#551904] flex items-center justify-center flex-shrink-0">
            <RocksGlass size={18} className="text-white" />
          </div>

          {/* Input pill: input + send */}
          <div className={`flex-1 flex items-center gap-2 rounded-full px-3 py-2 transition-colors ${THEME.inputBg}`}>
            <input
              ref={compactInputRef}
              type="text"
              value={compactInput}
              onChange={(e) => setCompactInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); submitCompact(); } }}
              onFocus={() => setCompactFocused(true)}
              onBlur={() => setCompactFocused(false)}
              tabIndex={isCompact ? 0 : -1}
              placeholder={compactFocused ? "" : "Chat with Rick"}
              aria-label="Chat with Rick"
              className={`flex-1 bg-transparent text-[16px] focus:outline-none min-w-0 ${THEME.inputText}`}
            />
            <button
              type="button"
              tabIndex={isCompact ? 0 : -1}
              onClick={submitCompact}
              disabled={!compactInput.trim()}
              aria-label="Send message to Rick"
              className={`flex-shrink-0 transition-colors disabled:opacity-30 ${THEME.iconColor}`}
            >
              <Send size={14} />
            </button>
          </div>

          {/* Scroll-to-top — outside the input pill; p-2.5 ensures ≥36px touch target */}
          <button
            type="button"
            tabIndex={isCompact ? 0 : -1}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            aria-label="Scroll to top"
            className={`flex-shrink-0 p-2.5 -mr-2.5 transition-colors ${THEME.iconColor}`}
          >
            <ArrowUp size={16} />
          </button>
        </div>
      </div>
    </>
  );
}
