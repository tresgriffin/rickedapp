"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import AppBar from "@/components/app-bar";
import PasswordInput from "@/components/password-input";
import PasswordStrength from "@/components/password-strength";
import LoadingDots from "@/components/loading-dots";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  if (!token) {
    return (
      <div className="text-center">
        <p className="text-sm text-gray-500 mb-4">This reset link is invalid or has expired.</p>
        <Link href="/forgot-password" className="text-sm font-bold text-[#551904] hover:underline">
          Request a new one
        </Link>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });

    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Something went wrong. Try again.");
      return;
    }

    setDone(true);
    setTimeout(() => router.replace("/login"), 2500);
  }

  if (done) {
    return (
      <div className="text-center">
        <p className="text-lg font-bold text-[#0d3c54] mb-2">Password updated.</p>
        <p className="text-sm text-gray-500">Redirecting you to login…</p>
      </div>
    );
  }

  return (
    <>
      <h1 className="font-[family-name:var(--font-abhaya-libre)] text-3xl font-bold text-[#0d3c54] mb-1">
        Choose a new password
      </h1>
      <p className="text-sm text-gray-500 mb-8">
        Make it something you&apos;ll remember — and hasn&apos;t been leaked.
      </p>
      {/* FUTURE: Phase 8b — HIBP password breach check */}

      {error && (
        <div className="mb-5 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="new-password" className="text-sm font-bold text-[#0d3c54]">
            New password
          </label>
          <PasswordInput
            id="new-password"
            value={password}
            onChange={setPassword}
            autoComplete="new-password"
            placeholder="At least 8 characters"
            required
          />
          <PasswordStrength password={password} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="confirm-password" className="text-sm font-bold text-[#0d3c54]">
            Confirm password
          </label>
          <PasswordInput
            id="confirm-password"
            value={confirm}
            onChange={setConfirm}
            autoComplete="new-password"
            placeholder="Same as above"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-2 w-full rounded-full bg-[#0d3c54] py-3.5 text-sm font-bold text-white transition hover:bg-[#0a2f42] focus:outline-none focus:ring-2 focus:ring-[#0d3c54] focus:ring-offset-2 disabled:opacity-60"
        >
          {loading
            ? <span className="flex items-center justify-center gap-2">Updating <LoadingDots /></span>
            : "Update password"}
        </button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#fffbfa]">
      <AppBar plain />
      <main className="flex-1 flex flex-col items-center justify-center px-5 py-10">
        <div className="w-full max-w-sm">
          <Suspense>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
