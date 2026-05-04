"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AppBar from "@/components/app-bar";
import LoadingDots from "@/components/loading-dots";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("Passwords don't match. Give it another look.");
      return;
    }
    if (password.length < 8) {
      setError("Password needs to be at least 8 characters.");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Something went wrong. Try again.");
      setLoading(false);
      return;
    }

    // Auto-sign-in after successful registration
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Account created! Head to login to sign in.");
      router.replace("/login");
    } else {
      // New users see the Rick handshake before the feed
      router.replace("/welcome");
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#fffbfa]">
      <AppBar plain />

      <main className="flex-1 flex flex-col items-center justify-center px-5 py-10">
        <div className="w-full max-w-sm">
          {/* Heading */}
          <h1 className="font-[family-name:var(--font-abhaya-libre)] text-3xl font-bold text-[#0d3c54] mb-1">
            Create your account
          </h1>
          <p className="text-sm text-gray-500 mb-8">
            Join the community. No pretension, just good bourbon.
          </p>

          {/* Error */}
          {error && (
            <div className="mb-5 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="name" className="text-sm font-bold text-[#0d3c54]">
                Name
              </label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Brian"
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0d3c54] transition"
              />
            </div>

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
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0d3c54] transition"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-sm font-bold text-[#0d3c54]">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0d3c54] transition"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="confirm"
                className="text-sm font-bold text-[#0d3c54]"
              >
                Confirm password
              </label>
              <input
                id="confirm"
                type="password"
                autoComplete="new-password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Same as above"
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0d3c54] transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-full bg-[#0d3c54] py-3.5 text-sm font-bold text-white transition hover:bg-[#0a2f42] focus:outline-none focus:ring-2 focus:ring-[#0d3c54] focus:ring-offset-2 disabled:opacity-60"
            >
              {loading ? <span className="flex items-center justify-center gap-2">Creating account <LoadingDots /></span> : "Create Account"}
            </button>
          </form>

          {/* Sign in link */}
          <p className="mt-8 text-center text-sm text-gray-500">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-bold text-[#551904] hover:underline"
            >
              Log in
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
