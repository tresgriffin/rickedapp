"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import AppBar from "@/components/app-bar";
import LoadingDots from "@/components/loading-dots";
import { submitAgeVerification } from "@/lib/actions/onboarding";

export default function VerifyAgePage() {
  const router = useRouter();
  const { update } = useSession();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setPending(true);

    const formData = new FormData(e.currentTarget);
    const result = await submitAgeVerification(formData);

    if ("error" in result) {
      setError(result.error);
      setPending(false);
      return;
    }

    // update() refreshes the JWT cookie so middleware sees ageVerified=true
    // before we navigate. redirect() in server actions throws and prevents this.
    await update();
    router.push("/onboarding/handle");
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#fffbfa]">
      <AppBar plain />

      <main className="flex-1 flex flex-col items-center justify-center px-5 py-10">
        <div className="w-full max-w-sm flex flex-col gap-6">
          <div>
            <h1 className="font-[family-name:var(--font-abhaya-libre)] text-3xl font-bold text-[#0d3c54] mb-2">
              One quick thing
            </h1>
            <p className="text-sm text-gray-500">
              Ricked is for adults 21 and older. Enter your date of birth to continue.
            </p>
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="dob" className="text-sm font-bold text-[#0d3c54]">
                Date of birth
              </label>
              <input
                id="dob"
                name="dateOfBirth"
                type="date"
                required
                max={new Date().toISOString().split("T")[0]}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-black focus:outline-none focus:ring-2 focus:ring-[#0d3c54] transition"
              />
            </div>

            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-full bg-[#0d3c54] py-3.5 text-sm font-bold text-white hover:bg-[#0a2f42] transition-colors disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0d3c54]"
            >
              {pending
                ? <span className="flex items-center justify-center gap-2">Checking <LoadingDots /></span>
                : "Continue"}
            </button>
          </form>

          <p className="text-xs text-gray-400 text-center leading-relaxed">
            We use your date of birth only to verify your age. It&apos;s not displayed publicly.
          </p>
        </div>
      </main>
    </div>
  );
}
