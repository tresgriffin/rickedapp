"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";

const COOLDOWN_SECONDS = 60;

/**
 * Inline verification prompt for gated actions.
 * Renders at the point of friction when requireVerifiedUser() blocks a write.
 * Gets the email from the session — no prop needed at callsites.
 */
export default function VerificationNudge() {
  const { data: session } = useSession();
  const email = session?.user?.email ?? null;

  const [resending, setResending] = useState(false);
  const [sent, setSent] = useState(false);
  const [cooldownLeft, setCooldownLeft] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => { if (cooldownRef.current) clearInterval(cooldownRef.current); };
  }, []);

  function startCooldown() {
    setCooldownLeft(COOLDOWN_SECONDS);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setCooldownLeft((s) => {
        if (s <= 1) { clearInterval(cooldownRef.current!); return 0; }
        return s - 1;
      });
    }, 1000);
  }

  async function handleResend() {
    if (resending || cooldownLeft > 0) return;
    setResending(true);
    try {
      await fetch("/api/auth/resend-verification", { method: "POST" });
      setSent(true);
      startCooldown();
    } catch {
      // fail silently — the nudge text is already actionable
    } finally {
      setResending(false);
    }
  }

  return (
    <p className="text-xs text-amber-700 leading-relaxed">
      Verify your email to do that. We sent a link to{" "}
      {email ? <span className="font-medium">{email}</span> : "your inbox"}.{" "}
      {sent ? (
        cooldownLeft > 0
          ? <span className="font-bold">Check your inbox. Resend in {cooldownLeft}s.</span>
          : (
            <button
              type="button"
              onClick={handleResend}
              className="font-bold underline hover:text-amber-900 transition-colors"
            >
              Resend
            </button>
          )
      ) : (
        <button
          type="button"
          onClick={handleResend}
          disabled={resending || cooldownLeft > 0}
          className="font-bold underline hover:text-amber-900 transition-colors disabled:opacity-50"
        >
          {resending ? "Sending..." : cooldownLeft > 0 ? `Resend in ${cooldownLeft}s` : "Resend"}
        </button>
      )}
    </p>
  );
}
