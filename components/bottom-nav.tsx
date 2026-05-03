"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, Search, Plus, User, Menu, Pencil, Sparkles, X } from "lucide-react";
import RocksGlass from "@/components/icons/rocks-glass";

interface NavItem {
  href: string | null;
  icon: React.ComponentType<{ size: number; strokeWidth: number }>;
  label: string;
  isAdd?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/home", icon: Home, label: "Home" },
  { href: "/search", icon: Search, label: "Search" },
  { href: null, icon: Plus, label: "Add", isAdd: true },
  { href: "/profile", icon: User, label: "Profile" },
  { href: "/more", icon: Menu, label: "More" },
];

const ADD_OPTIONS = [
  {
    href: "/post/new",
    icon: Pencil,
    label: "Post",
  },
  {
    href: "/recipe/new",
    Icon: RocksGlass,
    label: "Recipe",
  },
  {
    href: "/rick",
    icon: Sparkles,
    label: "Ask Rick",
  },
] as const;

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [showOverlay, setShowOverlay] = useState(false);

  function handleAddOption(href: string) {
    setShowOverlay(false);
    router.push(href);
  }

  return (
    <>
      {/* ── Add overlay ──────────────────────────────────────────────────── */}
      {showOverlay && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-30 bg-black/40 backdrop-blur-[1px]"
            onClick={() => setShowOverlay(false)}
            aria-hidden="true"
          />

          {/* Bottom sheet */}
          <div
            className="fixed inset-x-0 bottom-0 z-40 bg-white rounded-t-3xl px-6 pb-10 pt-5 shadow-2xl"
            role="dialog"
            aria-label="Add something"
          >
            {/* Header row */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-base font-bold text-[#0d3c54]">Add</p>
              <button
                type="button"
                onClick={() => setShowOverlay(false)}
                aria-label="Close"
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Three options */}
            <div className="flex justify-around gap-2">
              {ADD_OPTIONS.map((opt) => {
                const isRocksGlass = "Icon" in opt;
                return (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => handleAddOption(opt.href)}
                    className="flex flex-col items-center gap-2 flex-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0d3c54] rounded-xl p-2"
                  >
                    <div className="w-16 h-16 rounded-full bg-[#0d3c54] flex items-center justify-center shadow-sm">
                      {isRocksGlass ? (
                        <opt.Icon size={28} className="text-white" />
                      ) : (
                        <opt.icon size={28} strokeWidth={1.5} className="text-white" />
                      )}
                    </div>
                    <span className="text-sm font-bold text-[#0d3c54]">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* ── Nav bar ──────────────────────────────────────────────────────── */}
      <nav className="fixed bottom-0 left-0 right-0 z-20 bg-[#0d3c54] flex items-center justify-around h-16 px-1">
        {NAV_ITEMS.map(({ href, icon: Icon, label, isAdd }) => {
          // /profile only highlights on the user's own profile (/profile exactly),
          // not on /profile/[handle] pages which belong to other users.
          const isActive = href
            ? href === "/profile"
              ? pathname === "/profile"
              : pathname.startsWith(href)
            : false;

          if (isAdd) {
            return (
              <button
                key={label}
                type="button"
                aria-label="Add"
                onClick={() => setShowOverlay(true)}
                className="flex flex-col items-center justify-center gap-0.5 min-w-[48px] min-h-[48px] text-white/80 hover:text-white transition-colors"
              >
                <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center">
                  <Icon size={20} strokeWidth={2} />
                </div>
                <span className="text-[10px] font-medium">{label}</span>
              </button>
            );
          }

          return (
            <Link
              key={href}
              href={href!}
              className={`flex flex-col items-center justify-center gap-0.5 min-w-[48px] min-h-[48px] transition-colors ${
                isActive ? "text-white" : "text-white/55 hover:text-white/80"
              }`}
            >
              <Icon size={22} strokeWidth={isActive ? 2.5 : 1.5} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
