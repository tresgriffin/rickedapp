import Link from "next/link";

interface AppBarProps {
  /** Show a back arrow instead of the wordmark link */
  plain?: boolean;
}

export default function AppBar({ plain }: AppBarProps) {
  return (
    <header className="sticky top-0 z-20 w-full bg-[#0d3c54] px-4 py-3 flex items-center shadow-sm">
      {plain ? (
        <span
          className="font-[family-name:var(--font-abhaya-libre)] text-2xl font-bold text-white tracking-wide select-none"
        >
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
