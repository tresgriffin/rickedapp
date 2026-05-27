"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

export default function BackButton({ fallback }: { fallback: string }) {
  const router = useRouter();

  function handleBack() {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.replace(fallback);
    }
  }

  return (
    <button
      onClick={handleBack}
      className="flex items-center text-[#0d3c54]/70 hover:text-[#0d3c54] transition-colors mb-6 -ml-1"
      aria-label="Go back"
    >
      <ChevronLeft size={22} />
    </button>
  );
}
