"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { X } from "lucide-react";

interface WhiskeyResult {
  id: string;
  name: string;
  brand: string;
}

interface WhiskeyPickerProps {
  value: WhiskeyResult | null;
  onChange: (whiskey: WhiskeyResult | null) => void;
  placeholder?: string;
}

export default function WhiskeyPicker({
  value,
  onChange,
  placeholder = "Search for a whiskey...",
}: WhiskeyPickerProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<WhiskeyResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/whiskeys?q=${encodeURIComponent(q)}&pageSize=8`);
      if (!res.ok) return;
      const json = await res.json();
      setResults(json.data ?? []);
      setOpen(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, search]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (value) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-[#551904]/30 bg-[#fffbfa] px-3 py-2.5">
        <span className="text-sm font-bold text-[#0d3c54] flex-1 truncate">
          {value.name}
          <span className="font-normal text-gray-400"> · {value.brand}</span>
        </span>
        <button
          type="button"
          onClick={() => onChange(null)}
          aria-label="Remove tagged whiskey"
          className="text-gray-400 hover:text-gray-600 flex-shrink-0"
        >
          <X size={14} />
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-base text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0d3c54] transition"
      />

      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 z-20 bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
          {loading && (
            <p className="px-4 py-3 text-sm text-gray-400">Looking...</p>
          )}

          {!loading && results.length > 0 &&
            results.map((w) => (
              <button
                key={w.id}
                type="button"
                onClick={() => {
                  onChange(w);
                  setQuery("");
                  setOpen(false);
                }}
                className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
              >
                <span className="font-bold text-[#0d3c54]">{w.name}</span>
                <span className="text-gray-400"> · {w.brand}</span>
              </button>
            ))}

          {!loading && results.length === 0 && query.trim() && (
            <p className="px-4 py-3 text-sm text-gray-400">
              Nothing found for &ldquo;{query}&rdquo;.
              {/* FUTURE: surface "Add a new whiskey" CTA when query has no matches */}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
