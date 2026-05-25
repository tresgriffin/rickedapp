"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import LoadingDots from "@/components/loading-dots";
import { markRickHandshakeSeen } from "@/lib/actions/onboarding";

export default function WelcomeCTAs() {
  const router = useRouter();
  const { update } = useSession();
  const [pending, setPending] = useState(false);

  async function handleCTA(destination: "/rick" | "/home") {
    setPending(true);
    await markRickHandshakeSeen();
    // Refresh JWT so middleware sees the current ageVerified/handleSet state
    // before navigating to a gated route. redirect() in server actions throws
    // before update() can run, so we handle navigation here client-side.
    await update();
    router.push(destination);
  }

  return (
    <div className="flex flex-col gap-3 w-full max-w-sm">
      <button
        type="button"
        disabled={pending}
        onClick={() => handleCTA("/rick")}
        className="w-full rounded-full bg-white py-3.5 text-sm font-bold text-[#0d3c54] hover:bg-white/90 transition-colors disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d3c54]"
      >
        {pending ? <span className="flex items-center justify-center gap-2">One sec <LoadingDots /></span> : `Say "hi" to Rick`}
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => handleCTA("/home")}
        className="w-full rounded-full border border-white/30 py-3.5 text-sm font-bold text-white/80 hover:border-white/60 hover:text-white transition-colors disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
      >
        Maybe later
      </button>
    </div>
  );
}
