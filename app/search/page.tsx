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
import LoadingDots from "@/components/loading-dots";

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
  isAiGenerated: boolean;
  avgStars: number | null;
  ratingCount: number;
  user: { handle: string | null; displayName: string | null; avatarUrl: string | null };
  taggedWhiskey: { id: string; name: string; brand: string } | null;
}

interface UserResult {
  id: string;
  handle: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  _count: { recipes: number; followers: number };
}

// sessionStorage cache for the default catalog browse (no query, no filter).
// Preserves loaded batches and scroll position across back-navigation so the
// user lands on real content rather than triggering the scroll-before-render race.
const CATALOG_CACHE_KEY = "ricked-catalog-scroll";

interface CatalogCache {
  whiskeys: WhiskeyResult[];
  page: number;
  hasMore: boolean;
  scrollY: number;
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [whiskeys, setWhiskeys] = useState<WhiskeyResult[]>([]);
  const [recipes, setRecipes] = useState<RecipeResult[]>([]);
  const [users, setUsers] = useState<UserResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlightRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  // Stable ref so the intersection observer always reads current state
  const scrollStateRef = useRef({ hasMore: false, loadingMore: false, loading: false, query: "", category: "", page: 1 });
  scrollStateRef.current = { hasMore, loadingMore, loading, query, category, page };

  // Latest state snapshot for the unmount save — avoids stale closure in the empty-dep effect.
  const latestStateRef = useRef({ whiskeys: [] as WhiskeyResult[], page: 1, hasMore: false, query: "", category: "" });
  latestStateRef.current = { whiskeys, page, hasMore, query, category };

  // Set true by the cache-restore effect so the fetchAll that's already been
  // scheduled via setTimeout can bail out when it fires.
  const skipNextFetchRef = useRef(false);

  // Scroll Y to restore after cached items have painted.
  const pendingScrollRef = useRef<number | null>(null);

  const fetchMore = useCallback(async (q: string, cat: string, nextPage: number) => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    setLoadingMore(true);
    try {
      const params = new URLSearchParams({ pageSize: "20", page: String(nextPage) });
      if (q) params.set("q", q);
      if (cat) params.set("category", cat);
      const res = await fetch(`/api/whiskeys?${params}`);
      const json = await res.json();
      setWhiskeys((prev) => [...prev, ...(json.data ?? [])]);
      setHasMore(json.meta ? nextPage < json.meta.pageCount : false);
      setPage(nextPage);
    } finally {
      setLoadingMore(false);
      inFlightRef.current = false;
    }
  }, []);

  const fetchAll = useCallback(async (q: string, cat: string) => {
    // Cache-restore effect sets this flag before this timeout fires so we don't
    // overwrite restored state with a fresh page-1 fetch.
    if (skipNextFetchRef.current) {
      skipNextFetchRef.current = false;
      return;
    }
    setLoading(true);
    setPage(1);
    setHasMore(false);
    try {
      const whiskeyParams = new URLSearchParams({ pageSize: "20", page: "1" });
      if (q) whiskeyParams.set("q", q);
      if (cat) whiskeyParams.set("category", cat);

      const fetches: Promise<Response>[] = [fetch(`/api/whiskeys?${whiskeyParams}`)];
      if (q) {
        fetches.push(fetch(`/api/recipes?q=${encodeURIComponent(q)}&pageSize=5`));
        fetches.push(fetch(`/api/users?q=${encodeURIComponent(q)}&pageSize=5`));
      }

      const responses = await Promise.all(fetches);
      const jsons = await Promise.all(responses.map((r) => r.json()));

      setWhiskeys(jsons[0]?.data ?? []);
      setHasMore(jsons[0]?.meta ? 1 < jsons[0].meta.pageCount : false);
      setRecipes(q ? (jsons[1]?.data ?? []) : []);
      setUsers(q ? (jsons[2]?.data ?? []) : []);
      setHasSearched(true);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Effect 1: debounced fetch on query/category change ───────────────────
  // Defined first so React runs it before the cache-restore effect on initial
  // mount — this schedules the setTimeout before skipNextFetchRef is set.
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

  // ── Effect 2: restore catalog state from sessionStorage on mount ─────────
  // Runs after Effect 1 on initial mount. Sets skipNextFetchRef before the
  // setTimeout from Effect 1 fires (timeouts run in a later JS task).
  // Only restores when the user is on the default browse (no query/filter) —
  // search/filter results are never cached.
  useEffect(() => {
    if (query !== "" || category !== "") return;
    try {
      const raw = sessionStorage.getItem(CATALOG_CACHE_KEY);
      if (!raw) return;
      const cached: CatalogCache = JSON.parse(raw);
      if (cached.whiskeys.length > 0) {
        setWhiskeys(cached.whiskeys);
        setPage(cached.page);
        setHasMore(cached.hasMore);
        setHasSearched(true);
        skipNextFetchRef.current = true;
        pendingScrollRef.current = cached.scrollY;
      }
    } catch { /* ignore parse/storage errors */ }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Effect 3: restore scroll position after cached items have painted ────
  useEffect(() => {
    if (pendingScrollRef.current !== null && whiskeys.length > 0) {
      const y = pendingScrollRef.current;
      pendingScrollRef.current = null;
      // Double rAF ensures the browser has painted before scrolling.
      requestAnimationFrame(() => requestAnimationFrame(() => window.scrollTo(0, y)));
    }
  }, [whiskeys.length]);

  // ── Effect 4: save catalog state to sessionStorage on unmount ────────────
  // Empty deps = cleanup runs only on unmount. Reads from latestStateRef so
  // it always has current values despite the empty dep array.
  // Only saves for the default browse — searches/filters are not worth caching.
  useEffect(() => {
    return () => {
      const { whiskeys, page, hasMore, query, category } = latestStateRef.current;
      if (whiskeys.length > 0 && query === "" && category === "") {
        const cache: CatalogCache = { whiskeys, page, hasMore, scrollY: window.scrollY };
        try {
          sessionStorage.setItem(CATALOG_CACHE_KEY, JSON.stringify(cache));
        } catch { /* quota exceeded or private browsing — fail silently */ }
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Effect 5: invalidate cache when user starts a search/filter ──────────
  // The cached default-browse results are stale once the context changes.
  useEffect(() => {
    if (query !== "" || category !== "") {
      sessionStorage.removeItem(CATALOG_CACHE_KEY);
    }
  }, [query, category]);

  // ── Effect 6: intersection observer for infinite scroll ──────────────────
  // Created once; reads current state from scrollStateRef to avoid re-creation.
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        const { hasMore, loadingMore, loading, query, category, page } = scrollStateRef.current;
        if (hasMore && !loadingMore && !loading) {
          fetchMore(query, category, page + 1);
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [fetchMore]);

  const isEmpty =
    !loading && hasSearched && whiskeys.length === 0 && recipes.length === 0 && users.length === 0;

  return (
    <div className="flex flex-col min-h-screen bg-[#fffbfa]">
      <AppBar />

      {/* ── Sticky Rick affordance — fixed above bottom nav when query is active ── */}
      {query && (
        <div className="fixed bottom-16 left-0 right-0 z-10 px-4 py-2">
          <div className="bg-[#0d3c54] rounded-2xl px-4 py-3 flex items-center justify-between gap-3 shadow-lg">
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
        </div>
      )}

      <main className="flex-1 pb-36">
        {/* ── Sticky search bar + category chips ───────────────────────────────── */}
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
              className="w-full rounded-full border border-gray-200 bg-white pl-9 pr-4 py-2.5 text-base text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0d3c54] transition"
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
                  <div className="flex flex-wrap gap-1.5">
                    {r.taggedWhiskey && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#551904] bg-[#551904]/8 rounded-full px-2 py-0.5">
                        🥃 {r.taggedWhiskey.name}
                      </span>
                    )}
                    {r.isAiGenerated && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0d3c54] bg-[#0d3c54]/8 rounded-full px-2 py-0.5">
                        ✦ by Rick
                      </span>
                    )}
                  </div>
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

          {/* ── Infinite scroll sentinel + load-more indicator ──────────── */}
          <div ref={sentinelRef} />
          {loadingMore && (
            <div className="flex items-center justify-center gap-2 py-4 text-sm text-gray-400">
              Loading <LoadingDots />
            </div>
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
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
