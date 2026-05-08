"use client";

import { useState } from "react";
import AppBar from "@/components/app-bar";
import LoadingDots from "@/components/loading-dots";
import { submitWhiskeyInterest } from "@/lib/actions/onboarding";

const CHIPS = [
  { id: "BOURBON",  label: "Bourbon" },
  { id: "SCOTCH",   label: "Scotch" },
  { id: "RYE",      label: "Rye" },
  { id: "JAPANESE", label: "Japanese" },
  { id: "IRISH",    label: "Irish" },
  { id: "NOT_SURE", label: "Not sure yet" },
] as const;

type Interest = (typeof CHIPS)[number]["id"];

export default function InterestsPage() {
  const [selected, setSelected] = useState<Interest | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(interest: Interest | null) {
    setPending(true);
    const formData = new FormData();
    if (interest) formData.set("interest", interest);
    await submitWhiskeyInterest(formData);
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#fffbfa]">
      <AppBar plain />

      <main className="flex-1 flex flex-col items-center justify-center px-5 py-10">
        <div className="w-full max-w-sm flex flex-col gap-8">
          <div>
            <h1 className="font-[family-name:var(--font-abhaya-libre)] text-3xl font-bold text-[#0d3c54] mb-2">
              What are you most curious about right now?
            </h1>
            <p className="text-sm text-gray-500">
              Helps Rick know where to start. You can change this anytime.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {CHIPS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                disabled={pending}
                onClick={() => setSelected(id === selected ? null : id)}
                className={`rounded-full px-4 py-2 text-sm font-bold transition-colors ${
                  selected === id
                    ? "bg-[#0d3c54] text-white"
                    : "bg-white border border-gray-200 text-gray-600 hover:border-[#0d3c54]/40"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-3">
            <button
              type="button"
              disabled={pending || !selected}
              onClick={() => selected && handleSubmit(selected)}
              className="w-full rounded-full bg-[#0d3c54] py-3.5 text-sm font-bold text-white hover:bg-[#0a2f42] transition-colors disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0d3c54]"
            >
              {pending
                ? <span className="flex items-center justify-center gap-2">Saving <LoadingDots /></span>
                : "Continue"}
            </button>

            <button
              type="button"
              disabled={pending}
              onClick={() => handleSubmit(null)}
              className="w-full rounded-full border border-gray-200 py-3.5 text-sm font-bold text-gray-500 hover:border-[#0d3c54]/30 transition-colors disabled:opacity-40"
            >
              Skip for now
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
