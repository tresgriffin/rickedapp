"use client";

import { useState, useEffect, useRef } from "react";
import { X, Mail } from "lucide-react";
import LoadingDots from "@/components/loading-dots";

const COOLDOWN_SECONDS = 60;

export default function EmailVerificationBanner() {
  const [dismissed, setDismissed] = useState(false);
  const [resending, setResending] = useState(false);
  const [resentConfirm, setResentConfirm] = useState("");
  const [resendError, setResendError] = useState("");
  const [cooldownLeft, setCooldownLeft] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { if (cooldownRef.current) clearInterval(cooldownRef.current); }, []);

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
    if (cooldownLeft > 0 || resending) return;
    setResending(true);
    setResendError("");
    setResentConfirm("");

    const res = await fetch("/api/auth/resend-verification", { method: "POST" });
    setResending(false);

    if (res.ok) {
      setResentConfirm("Check your inbox — email sent.");
      startCooldown();
    } else {
      const data = await res.json().catch(() => ({}));
      if (data.error === "Email is already verified.") {
        setResendError("Your email is already verified — refresh the page.");
      } else {
        setResendError("Couldn't send the email. Check your connection and try again.");
      }
    }
  }

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 flex items-start gap-3">
      <Mail size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-amber-800">
          <span className="font-bold">Quick one:</span> verify your email to post, review, and follow.
        </p>
        {resentConfirm && (
          <p className="text-xs font-medium text-amber-700 mt-0.5">{resentConfirm}</p>
        )}
        {resendError && (
          <p className="text-xs text-red-600 mt-0.5">{resendError}</p>
        )}
        <button
          type="button"
          onClick={handleResend}
          disabled={resending || cooldownLeft > 0}
          className="mt-1 text-xs font-bold text-amber-700 hover:text-amber-900 transition-colors disabled:opacity-50"
        >
          {resending
            ? <span className="flex items-center gap-1">Sending <LoadingDots /></span>
            : cooldownLeft > 0
              ? `Resend in ${cooldownLeft}s`
              : "Resend verification email"}
        </button>
      </div>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        className="text-amber-500 hover:text-amber-700 transition-colors flex-shrink-0"
      >
        <X size={16} />
      </button>
    </div>
  );
}
