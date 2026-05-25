"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import LoadingDots from "@/components/loading-dots";
import PasswordInput from "@/components/password-input";

// TODO Phase 8b: enable Google OAuth — set NEXT_PUBLIC_ENABLE_SOCIAL_AUTH=true in Vercel
const ENABLE_SOCIAL_AUTH = process.env.NEXT_PUBLIC_ENABLE_SOCIAL_AUTH === "true";

const COOLDOWN_SECONDS = 60;

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailChanged = searchParams.get("email_changed") === "1";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Unverified-email affordance
  const [needsVerification, setNeedsVerification] = useState(false);
  const [resending, setResending] = useState(false);
  const [resentConfirm, setResentConfirm] = useState("");
  const [cooldownLeft, setCooldownLeft] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function startCooldown() {
    setCooldownLeft(COOLDOWN_SECONDS);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setCooldownLeft((s) => {
        if (s <= 1) {
          clearInterval(cooldownRef.current!);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }

  useEffect(() => () => { if (cooldownRef.current) clearInterval(cooldownRef.current); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setNeedsVerification(false);
    setResentConfirm("");
    setLoading(true);

    const result = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);

    if (result?.error) {
      // Auto-check whether the failure is an unverified-email issue
      try {
        const res = await fetch(`/api/auth/check-unverified?email=${encodeURIComponent(email)}`);
        const data = await res.json();
        if (data.needsVerification) {
          setNeedsVerification(true);
          setError("You need to verify your email before signing in.");
          return;
        }
      } catch {
        // If check fails, fall through to generic error
      }
      setError("Incorrect email or password. Give it another shot.");
    } else {
      router.replace("/home");
    }
  }

  async function handleResend() {
    if (cooldownLeft > 0 || resending) return;
    setResending(true);
    setResentConfirm("");

    try {
      await fetch("/api/auth/resend-verification-public", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setResentConfirm("Check your inbox — email sent.");
      startCooldown();
    } catch {
      setResentConfirm("Couldn't send the email. Check your connection and try again.");
    } finally {
      setResending(false);
    }
  }

  async function handleGoogle() {
    await signIn("google", { callbackUrl: "/home" });
  }

  return (
    <div className="flex flex-col min-h-dvh bg-[#fffbfa]">
      <main className="flex-1 flex flex-col items-center justify-center px-5 py-10">
        <div className="w-full max-w-sm">
          {/* Wordmark */}
          <div className="flex justify-center mb-8">
            <Image
              src="/ricked-assets/ricked-lockup-horizontal-dark.svg"
              alt="Ricked"
              width={3289}
              height={850}
              className="h-9 w-auto"
              priority
            />
          </div>
          {/* Heading */}
          <h1 className="font-[family-name:var(--font-abhaya-libre)] text-3xl font-bold text-[#0d3c54] mb-1">
            Welcome back
          </h1>
          <p className="text-sm text-gray-500 mb-8">
            Good to see you again. Sign in below.
          </p>

          {/* Email changed confirmation */}
          {emailChanged && (
            <div className="mb-5 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
              Email updated. Sign in with your new address.
            </div>
          )}

          {/* Error / unverified state */}
          {error && (
            <div className={`mb-5 rounded-lg px-4 py-3 text-sm ${needsVerification ? "bg-amber-50 border border-amber-200 text-amber-800" : "bg-red-50 border border-red-200 text-red-700"}`}>
              <p>{error}</p>
              {needsVerification && (
                <div className="mt-2">
                  {resentConfirm ? (
                    <p className="text-xs font-medium text-amber-700">{resentConfirm}</p>
                  ) : null}
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
              )}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-sm font-bold text-[#0d3c54]">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => { setEmail(e.target.value); setNeedsVerification(false); setError(""); }}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-base text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0d3c54] transition"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-bold text-[#0d3c54]">
                  Password
                </label>
                <Link href="/forgot-password" className="text-xs font-bold text-[#551904] hover:underline">
                  Forgot password?
                </Link>
              </div>
              <PasswordInput
                id="password"
                value={password}
                onChange={setPassword}
                autoComplete="current-password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-full bg-[#0d3c54] py-3.5 text-sm font-bold text-white transition hover:bg-[#0a2f42] focus:outline-none focus:ring-2 focus:ring-[#0d3c54] focus:ring-offset-2 disabled:opacity-60"
            >
              {loading ? <span className="flex items-center justify-center gap-2">Signing in <LoadingDots /></span> : "Login"}
            </button>
          </form>

          {/* Social sign-in — hidden during closed beta; enable via NEXT_PUBLIC_ENABLE_SOCIAL_AUTH */}
          {ENABLE_SOCIAL_AUTH && (
            <>
              <div className="my-6 flex items-center gap-3">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400 uppercase tracking-wide">or</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={handleGoogle}
                  className="flex w-full items-center justify-center gap-3 rounded-full border border-gray-200 bg-white py-3 text-sm font-bold text-black transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#0d3c54]"
                >
                  <GoogleIcon />
                  Continue with Google
                </button>

                <button
                  type="button"
                  disabled
                  title="Coming soon"
                  className="flex w-full items-center justify-center gap-3 rounded-full border border-gray-200 bg-white py-3 text-sm font-bold text-gray-400 cursor-not-allowed"
                >
                  <FacebookIcon />
                  Continue with Facebook
                </button>

                <button
                  type="button"
                  disabled
                  title="Coming soon"
                  className="flex w-full items-center justify-center gap-3 rounded-full border border-gray-200 bg-white py-3 text-sm font-bold text-gray-400 cursor-not-allowed"
                >
                  <AppleIcon />
                  Continue with Apple
                </button>
              </div>
            </>
          )}

          {/* Sign up link */}
          <p className="mt-8 text-center text-sm text-gray-500">
            New to Ricked?{" "}
            <Link href="/signup" className="font-bold text-[#551904] hover:underline">
              Create your account
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" />
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="#1877F2">
      <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.268h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701z" />
    </svg>
  );
}
