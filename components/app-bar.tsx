import Link from "next/link";
import { ChevronLeft } from "lucide-react";

interface AppBarProps {
  plain?: boolean;
  showBack?: boolean;
  title?: string;
}

export default function AppBar({ plain, showBack, title }: AppBarProps) {
  return (
    <header className="sticky top-0 z-20 w-full bg-[#0d3c54] px-4 py-3 flex items-center gap-2 shadow-sm">
      {showBack && (
        <Link
          href=".."
          className="text-white/80 hover:text-white transition-colors mr-1"
          aria-label="Go back"
        >
          <ChevronLeft size={22} />
        </Link>
      )}
      {title ? (
        <span className="text-base font-bold text-white">{title}</span>
      ) : plain ? (
        <span className="font-[family-name:var(--font-abhaya-libre)] text-2xl font-bold text-white tracking-wide select-none">
          ricked
        </span>
      ) : (
        <Link
          href="/home"
          className="font-[family-name:var(--font-abhaya-libre)] text-2xl font-bold text-white tracking-wide"
        >
          ricked
        </Link>
      )}
    </header>
  );
}
