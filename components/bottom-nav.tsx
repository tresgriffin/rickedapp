"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, PlusCircle, User, Menu } from "lucide-react";

interface NavItem {
  href: string | null;
  icon: React.ComponentType<{ size: number; strokeWidth: number }>;
  label: string;
  center?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/home", icon: Home, label: "Home" },
  { href: "/search", icon: Search, label: "Search" },
  { href: null, icon: PlusCircle, label: "Add", center: true },
  { href: "/profile", icon: User, label: "Profile" },
  { href: "/menu", icon: Menu, label: "More" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 bg-[#0d3c54] flex items-center justify-around h-16 px-1 safe-bottom">
      {NAV_ITEMS.map(({ href, icon: Icon, label, center }) => {
        const isActive = href ? pathname.startsWith(href) : false;

        if (!href) {
          // Phase 4 will wire this up to the Add overlay
          return (
            <button
              key={label}
              type="button"
              aria-label="Add (coming soon)"
              className="flex flex-col items-center justify-center gap-0.5 min-w-[48px] min-h-[48px] text-white/70 cursor-default"
            >
              <Icon size={30} strokeWidth={1.5} />
              <span className="text-[10px] font-medium">{label}</span>
            </button>
          );
        }

        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center justify-center gap-0.5 min-w-[48px] min-h-[48px] transition-colors ${
              center ? "" : ""
            } ${isActive ? "text-white" : "text-white/55 hover:text-white/80"}`}
          >
            <Icon size={22} strokeWidth={isActive ? 2.5 : 1.5} />
            <span className="text-[10px] font-medium">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
