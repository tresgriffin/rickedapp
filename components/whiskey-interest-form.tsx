"use client";

import { useState, useTransition } from "react";
import type { WhiskeyInterest } from "@/app/generated/prisma/client";
import { updateWhiskeyInterest } from "@/lib/actions/onboarding";
import LoadingDots from "@/components/loading-dots";

const CHIPS: { id: WhiskeyInterest; label: string }[] = [
  { id: "BOURBON",  label: "Bourbon" },
  { id: "SCOTCH",   label: "Scotch" },
  { id: "RYE",      label: "Rye" },
  { id: "JAPANESE", label: "Japanese" },
  { id: "IRISH",    label: "Irish" },
  { id: "NOT_SURE", label: "Not sure yet" },
];

export default function WhiskeyInterestForm({ current }: { current: WhiskeyInterest | null }) {
  const [selected, setSelected] = useState<WhiskeyInterest | null>(current);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function handleSave() {
    startTransition(async () => {
      await updateWhiskeyInterest(selected);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  return (
    <div className="flex flex-col gap-4">
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

      <button
        type="button"
        disabled={pending}
        onClick={handleSave}
        className="self-start rounded-full bg-[#0d3c54] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#0a2f42] transition-colors disabled:opacity-50"
      >
        {pending
          ? <span className="flex items-center gap-2">Saving <LoadingDots /></span>
          : saved ? "Saved" : "Save"}
      </button>
    </div>
  );
}
