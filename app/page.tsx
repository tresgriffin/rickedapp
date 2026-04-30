"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function SplashPage() {
  const router = useRouter();
  const { status } = useSession();

  useEffect(() => {
    const delay = status === "loading" ? 2000 : 1200;
    const timer = setTimeout(() => {
      if (status === "authenticated") {
        router.replace("/home");
      } else {
        router.replace("/login");
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [status, router]);

  return (
    <main className="flex-1 flex flex-col items-center justify-center min-h-screen bg-[#0d3c54]">
      <h1 className="font-[family-name:var(--font-abhaya-libre)] text-7xl font-bold text-white tracking-widest select-none">
        ricked
      </h1>
    </main>
  );
}
