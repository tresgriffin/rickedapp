"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Search } from "lucide-react";
import AppBar from "@/components/app-bar";
import BottomNav from "@/components/bottom-nav";
import WhiskeyCard from "@/components/whiskey-card";
import EmptyState from "@/components/empty-state";

const CATEGORIES = [
  { id: "", label: "All" },
  { id: "BOURBON", label: "Bourbon" },
  { id: "RYE", label: "Rye" },
  { id: "TENNESSEE", label: "Tennessee" },
  { id: "SCOTCH", label: "Scotch" },
  { id: "IRISH", label: "Irish" },
  { id: "JAPANESE", label: "Japanese" },
  { id: "OTHER", label: "Other" },
];

interface WhiskeyResult {
  id: string;
  name: string;
  brand: string;
  category: string;
  proof: number | null;
  ageYears: number | null;
  imageUrl: string;
  avgRating: number | null;
  reviewCount: number;
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [results, setResults] = useState<WhiskeyResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchWhiskeys = useCallback(async (q: string, cat: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ pageSize: "30" });
      if (q) params.set("q", q);
      if (cat) params.set("category", cat);
      const res = await fetch(`/api/whiskeys?${params}`);
      if (!res.ok) return;
      const json = await res.json();
      setResults(json.data ?? []);
    } finally {
      setLoading(false);
      setHasSearched(true);
    }
  }, []);

  // Debounced search — runs on mount (loading all whiskeys) and on every change
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    // Shorter delay on mount so the initial list appears quickly
    const delay = hasSearched ? 300 : 0;
    debounceRef.current = setTimeout(() => {
      fetchWhiskeys(query, category);
    }, delay);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // hasSearched intentionally excluded — we only want the 0-delay on first mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, category, fetchWhiskeys]);

  const showEmpty = !loading && hasSearched && results.length === 0;
  const showInitialPrompt = !hasSearched && !loading;

  return (
    <div className="flex flex-col min-h-screen bg-[#fffbfa]">
      <AppBar />

      <main className="flex-1 pb-20">
        {/* Search input */}
        <div className="sticky top-[52px] z-10 bg-[#fffbfa] px-4 pt-3 pb-2 border-b border-gray-100">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <input
              type="search"
              placeholder="Search whiskeys…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-full border border-gray-200 bg-white pl-9 pr-4 py-2.5 text-sm text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0d3c54] transition"
              autoComplete="off"
            />
          </div>

          {/* Category chips */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar pt-2.5 pb-0.5">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.id)}
                className={`flex-shrink-0 rounded-full px-3 py-1 text-xs font-bold transition-colors ${
                  category === cat.id
                    ? "bg-[#0d3c54] text-white"
                    : "bg-white border border-gray-200 text-gray-500 hover:border-[#0d3c54]/30"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        <div className="px-4 pt-4 flex flex-col gap-3">
          {loading && (
            <div className="py-10 flex justify-center">
              <span className="text-sm text-gray-400">Loading…</span>
            </div>
          )}

          {showInitialPrompt && !loading && (
            <p className="text-sm text-gray-400 text-center py-10">
              Start typing to find a whiskey.
            </p>
          )}

          {showEmpty && (
            <EmptyState
              message="Nothing came up."
              sub={
                query
                  ? `Rick's never heard of "${query}" either — try a different name or browse a category.`
                  : "Try a different category."
              }
            />
          )}

          {!loading &&
            results.map((w) => <WhiskeyCard key={w.id} whiskey={w} />)}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
