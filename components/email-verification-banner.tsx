"use client";

import { useState } from "react";
import { X, Mail } from "lucide-react";
import LoadingDots from "@/components/loading-dots";

export default function EmailVerificationBanner() {
  const [dismissed, setDismissed] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [error, setError] = useState("");

  if (dismissed) return null;

  async function handleResend() {
    setResending(true);
    setError("");
    const res = await fetch("/api/auth/resend-verification", { method: "POST" });
    setResending(false);
    if (res.ok) {
      setResent(true);
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong. Try again.");
    }
  }

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 flex items-start gap-3">
      <Mail size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        {resent ? (
          <p className="text-sm text-amber-800 font-medium">
            Verification email sent — check your inbox.
          </p>
        ) : (
          <>
            <p className="text-sm text-amber-800">
              <span className="font-bold">Quick one:</span> verify your email to post, review, and follow.
            </p>
            {error && <p className="text-xs text-red-600 mt-0.5">{error}</p>}
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="mt-1 text-xs font-bold text-amber-700 hover:text-amber-900 transition-colors disabled:opacity-50"
            >
              {resending
                ? <span className="flex items-center gap-1">Sending <LoadingDots /></span>
                : "Resend verification email"}
            </button>
          </>
        )}
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
