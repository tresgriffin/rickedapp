"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";

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
    <>
      <style>{`html, body { background: #0d3c54; }`}</style>
      <main className="flex-1 flex flex-col items-center justify-center min-h-dvh bg-[#0d3c54]">
        <Image
          src="/ricked-assets/ricked-lockup-vertical-light.svg"
          alt="Ricked"
          width={1150}
          height={1288}
          className="w-48 h-auto"
          priority
        />
      </main>
    </>
  );
}
