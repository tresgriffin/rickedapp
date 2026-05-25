import Link from "next/link";
import Image from "next/image";
import { ChevronLeft } from "lucide-react";

interface AppBarProps {
  plain?: boolean;
  showBack?: boolean;
  title?: string;
}

export default function AppBar({ plain, showBack, title }: AppBarProps) {
  return (
    <header className="sticky top-0 z-20 w-full bg-[#0d3c54] px-4 pb-3 pt-appbar flex items-center gap-2 shadow-sm">
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
        <Image
          src="/ricked-assets/ricked-lockup-horizontal-light.svg"
          alt="Ricked"
          width={3289}
          height={850}
          className="h-7 w-auto"
          priority
        />
      ) : (
        <Link href="/home" aria-label="Ricked home">
          <Image
            src="/ricked-assets/ricked-lockup-horizontal-light.svg"
            alt="Ricked"
            width={3289}
            height={850}
            className="h-7 w-auto"
            priority
          />
        </Link>
      )}
    </header>
  );
}
