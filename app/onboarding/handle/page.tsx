"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { CheckCircle, XCircle } from "lucide-react";
import AppBar from "@/components/app-bar";
import LoadingDots from "@/components/loading-dots";
import { submitHandle } from "@/lib/actions/onboarding";

type CheckState = "idle" | "checking" | "available" | "taken" | "invalid";

export default function HandlePage() {
  const router = useRouter();
  const { update } = useSession();
  const [handle, setHandle] = useState("");
  const [checkState, setCheckState] = useState<CheckState>("idle");
  const [checkMessage, setCheckMessage] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const cleaned = handle.trim().toLowerCase();

    // Defer all state updates into the async callback to avoid synchronous setState in effect
    debounceRef.current = setTimeout(async () => {
      if (!cleaned) {
        setCheckState("idle");
        setCheckMessage("");
        setSuggestions([]);
        return;
      }

      setCheckState("checking");

      const res = await fetch(`/api/check-handle?handle=${encodeURIComponent(cleaned)}`);
      const data = await res.json();

      if (data.available) {
        setCheckState("available");
        setCheckMessage("");
        setSuggestions([]);
      } else if (data.error) {
        setCheckState(data.suggestions ? "taken" : "invalid");
        setCheckMessage(data.error);
        setSuggestions(data.suggestions ?? []);
      }
    }, cleaned ? 350 : 0);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [handle]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (checkState !== "available") return;
    setError("");
    setPending(true);

    const formData = new FormData(e.currentTarget);
    const result = await submitHandle(formData);

    if (result && "error" in result) {
      setError(result.error);
      setPending(false);
      return;
    }

    // update() refreshes the JWT cookie so middleware sees handleSet=true
    // before we navigate. redirect() in server actions throws and prevents this.
    await update();
    router.push("/onboarding/interests");
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#fffbfa]">
      <AppBar plain />

      <main className="flex-1 flex flex-col items-center justify-center px-5 py-10">
        <div className="w-full max-w-sm flex flex-col gap-6">
          <div>
            <h1 className="font-[family-name:var(--font-abhaya-libre)] text-3xl font-bold text-[#0d3c54] mb-2">
              Pick a handle
            </h1>
            <p className="text-sm text-gray-500">
              This is how people find you. Letters, numbers, underscores. 3–20 characters.
            </p>
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="handle" className="text-sm font-bold text-[#0d3c54]">
                Handle
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm select-none pointer-events-none">
                  @
                </span>
                <input
                  id="handle"
                  name="handle"
                  type="text"
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  required
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  placeholder="yourhandle"
                  maxLength={20}
                  className="w-full rounded-xl border border-gray-200 bg-white pl-8 pr-10 py-3 text-base text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0d3c54] transition"
                />
                {/* Status indicator */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {checkState === "checking" && (
                    <span className="text-gray-400"><LoadingDots /></span>
                  )}
                  {checkState === "available" && (
                    <CheckCircle size={18} className="text-green-500" />
                  )}
                  {(checkState === "taken" || checkState === "invalid") && (
                    <XCircle size={18} className="text-red-400" />
                  )}
                </div>
              </div>

              {/* Inline feedback */}
              {checkState === "available" && (
                <p className="text-xs text-green-600 font-medium">Available</p>
              )}
              {(checkState === "taken" || checkState === "invalid") && checkMessage && (
                <p className="text-xs text-red-500">{checkMessage}</p>
              )}

              {/* Suggestions when taken */}
              {suggestions.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-1">
                  <span className="text-xs text-gray-400">Try:</span>
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setHandle(s)}
                      className="text-xs font-bold text-[#0d3c54] hover:underline"
                    >
                      @{s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={pending || checkState !== "available"}
              className="w-full rounded-full bg-[#0d3c54] py-3.5 text-sm font-bold text-white hover:bg-[#0a2f42] transition-colors disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0d3c54]"
            >
              {pending
                ? <span className="flex items-center justify-center gap-2">Saving <LoadingDots /></span>
                : "Claim handle"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
