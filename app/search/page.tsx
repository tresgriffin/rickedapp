"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { Search, Sparkles } from "lucide-react";
import AppBar from "@/components/app-bar";
import BottomNav from "@/components/bottom-nav";
import WhiskeyCard from "@/components/whiskey-card";
import Avatar from "@/components/avatar";
import StarRating from "@/components/star-rating";
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

interface RecipeResult {
  id: string;
  title: string;
  description: string | null;
  ingredientCount: number;
  avgStars: number | null;
  ratingCount: number;
  user: { handle: string | null; displayName: string | null; avatarUrl: string | null };
}

interface UserResult {
  id: string;
  handle: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  _count: { recipes: number; followers: number };
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [whiskeys, setWhiskeys] = useState<WhiskeyResult[]>([]);
  const [recipes, setRecipes] = useState<RecipeResult[]>([]);
  const [users, setUsers] = useState<UserResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchAll = useCallback(
    async (q: string, cat: string) => {
      setLoading(true);
      try {
        const whiskeyParams = new URLSearchParams({ pageSize: "20" });
        if (q) whiskeyParams.set("q", q);
        if (cat) whiskeyParams.set("category", cat);

        const fetches: Promise<Response>[] = [
          fetch(`/api/whiskeys?${whiskeyParams}`),
        ];

        if (q) {
          fetches.push(fetch(`/api/recipes?q=${encodeURIComponent(q)}&pageSize=5`));
          fetches.push(fetch(`/api/users?q=${encodeURIComponent(q)}&pageSize=5`));
        }

        const responses = await Promise.all(fetches);
        const jsons = await Promise.all(responses.map((r) => r.json()));

        setWhiskeys(jsons[0]?.data ?? []);
        setRecipes(q ? (jsons[1]?.data ?? []) : []);
        setUsers(q ? (jsons[2]?.data ?? []) : []);
        setHasSearched(true);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Debounced fetch — delay 0 on first mount, 300ms after
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const delay = hasSearched ? 300 : 0;
    debounceRef.current = setTimeout(() => fetchAll(query, category), delay);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // hasSearched intentionally excluded — controls first-load delay only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, category, fetchAll]);

  const isEmpty = !loading && hasSearched && whiskeys.length === 0 && recipes.length === 0 && users.length === 0;

  return (
    <div className="flex flex-col min-h-screen bg-[#fffbfa]">
      <AppBar />

      <main className="flex-1 pb-20">
        {/* ── Search bar + category chips ───────────────────────────────── */}
        <div className="sticky top-[52px] z-10 bg-[#fffbfa] px-4 pt-3 pb-2 border-b border-gray-100">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <input
              type="search"
              placeholder="Whiskeys, recipes, people…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-full border border-gray-200 bg-white pl-9 pr-4 py-2.5 text-sm text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0d3c54] transition"
              autoComplete="off"
            />
          </div>
          {/* Category chips — filter whiskeys only */}
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

        <div className="px-4 pt-4 flex flex-col gap-6">
          {loading && (
            <div className="py-10 flex justify-center">
              <span className="text-sm text-gray-400">Loading…</span>
            </div>
          )}

          {!loading && isEmpty && query && (
            <EmptyState
              message="Nothing found."
              sub={`Nothing found for "${query}". Try a different name or browse a category.`}
            />
          )}

          {/* ── Whiskeys section ─────────────────────────────────────────── */}
          {!loading && whiskeys.length > 0 && (
            <section className="flex flex-col gap-3">
              {query && (
                <h2 className="text-xs font-bold uppercase tracking-widest text-[#0d3c54]">
                  Whiskeys
                </h2>
              )}
              {whiskeys.map((w) => (
                <WhiskeyCard key={w.id} whiskey={w} />
              ))}
            </section>
          )}

          {/* ── Recipes section ──────────────────────────────────────────── */}
          {!loading && recipes.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className="text-xs font-bold uppercase tracking-widest text-[#0d3c54]">
                Recipes
              </h2>
              {recipes.map((r) => (
                <Link
                  key={r.id}
                  href={`/recipe/${r.id}`}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col gap-1.5 hover:border-[#0d3c54]/20 transition-colors active:scale-[0.98]"
                >
                  <p className="text-sm font-bold text-[#0d3c54]">{r.title}</p>
                  {r.description && (
                    <p className="text-xs text-gray-500 line-clamp-1">{r.description}</p>
                  )}
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-[11px] font-bold uppercase tracking-wide text-[#551904] bg-[#551904]/8 rounded-full px-2 py-0.5">
                      {r.ingredientCount} ingredient{r.ingredientCount === 1 ? "" : "s"}
                    </span>
                    {r.avgStars != null && r.ratingCount > 0 && (
                      <StarRating rating={r.avgStars} size="sm" showValue />
                    )}
                    <span className="text-xs text-gray-400">
                      by {r.user.displayName ?? r.user.handle}
                    </span>
                  </div>
                </Link>
              ))}
            </section>
          )}

          {/* ── People section ───────────────────────────────────────────── */}
          {!loading && users.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className="text-xs font-bold uppercase tracking-widest text-[#0d3c54]">
                People
              </h2>
              {users.map((u) => (
                <Link
                  key={u.id}
                  href={u.handle ? `/profile/${u.handle}` : "#"}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3 hover:border-[#0d3c54]/20 transition-colors"
                >
                  <Avatar displayName={u.displayName} avatarUrl={u.avatarUrl} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[#0d3c54] truncate">
                      {u.displayName ?? u.handle}
                    </p>
                    <p className="text-xs text-gray-400">@{u.handle}</p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-xs font-bold text-[#0d3c54]">{u._count.recipes}</p>
                    <p className="text-[10px] text-gray-400">recipes</p>
                  </div>
                </Link>
              ))}
            </section>
          )}

          {/* ── Rick affordance ──────────────────────────────────────────── */}
          {query && !loading && (
            <div className="bg-[#0d3c54] rounded-2xl p-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-white">Not finding it?</p>
                <p className="text-xs text-white/60">Rick can suggest something.</p>
              </div>
              <Link
                href={`/rick?prompt=${encodeURIComponent(query)}`}
                className="flex-shrink-0 flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-bold text-[#0d3c54] hover:bg-white/90 transition-colors"
              >
                <Sparkles size={12} />
                Ask Rick
              </Link>
            </div>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
