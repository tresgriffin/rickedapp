"use client";

import { useState, useRef, useEffect } from "react";
import { X } from "lucide-react";
import { useSession } from "next-auth/react";

const COOLDOWN_SECONDS = 60;

interface VerificationNudgeProps {
  /** When true, renders as a fixed-bottom toast instead of inline.
   *  Use for compact action points (e.g. FollowButton) where inline
   *  text would overflow the parent container. */
  toast?: boolean;
}

/**
 * Inline or toast verification prompt for gated actions.
 * Gets the user's email from the session — no prop threading needed.
 */
export default function VerificationNudge({ toast = false }: VerificationNudgeProps) {
  const { data: session } = useSession();
  const email = session?.user?.email ?? null;

  const [resending, setResending] = useState(false);
  const [sent, setSent] = useState(false);
  const [cooldownLeft, setCooldownLeft] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => { if (cooldownRef.current) clearInterval(cooldownRef.current); };
  }, []);

  if (dismissed) return null;

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
      // fail silently
    } finally {
      setResending(false);
    }
  }

  const nudgeText = (
    <p className="text-xs text-amber-700 leading-relaxed">
      Verify your email to do that. We sent a link to{" "}
      {email ? <span className="font-medium">{email}</span> : "your inbox"}.{" "}
      {sent ? (
        cooldownLeft > 0
          ? <span className="font-bold">Check your inbox. Email sent.</span>
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

  if (toast) {
    return (
      <div className="fixed bottom-20 left-4 right-4 z-50 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 shadow-lg flex items-start gap-3">
        <div className="flex-1 min-w-0">{nudgeText}</div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
          className="flex-shrink-0 text-amber-400 hover:text-amber-600 transition-colors mt-0.5"
        >
          <X size={14} />
        </button>
      </div>
    );
  }

  return nudgeText;
}
