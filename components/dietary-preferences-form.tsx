"use client";

import { useTransition } from "react";
import { updateDietaryPreferences, skipDietaryPreferences } from "@/lib/actions/dietary";
import type { DietaryRestriction } from "@/app/generated/prisma/client";
import LoadingDots from "@/components/loading-dots";

const RESTRICTIONS: { id: DietaryRestriction; label: string }[] = [
  { id: "DAIRY_FREE", label: "Dairy-free" },
  { id: "NUT_FREE", label: "Nut-free" },
  { id: "EGG_FREE", label: "Egg-free" },
  { id: "GLUTEN_FREE", label: "Gluten-free" },
  { id: "SULFITE_FREE", label: "Sulfite-free" },
  { id: "VEGAN", label: "Vegan" },
  { id: "VEGETARIAN", label: "Vegetarian" },
];

interface Props {
  current: DietaryRestriction[];
  currentNotes: string;
  redirectTo: string;
  showSkip: boolean;
}

export default function DietaryPreferencesForm({ current, currentNotes, redirectTo, showSkip }: Props) {
  const [pending, startTransition] = useTransition();

  return (
    <form
      action={updateDietaryPreferences}
      className="flex flex-col gap-6"
    >
      <input type="hidden" name="redirectTo" value={redirectTo} />

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-100">
        {RESTRICTIONS.map(({ id, label }) => (
          <label
            key={id}
            className="flex items-center justify-between px-4 py-3.5 cursor-pointer hover:bg-gray-50 transition-colors first:rounded-t-2xl last:rounded-b-2xl"
          >
            <span className="text-sm font-medium text-[#0d3c54]">{label}</span>
            <input
              type="checkbox"
              name={id}
              defaultChecked={current.includes(id)}
              className="w-5 h-5 rounded accent-[#0d3c54]"
            />
          </label>
        ))}
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold uppercase tracking-widest text-[#0d3c54]">
          Notes (optional)
        </label>
        <textarea
          name="dietaryNotes"
          defaultValue={currentNotes}
          placeholder="Anything else Rick should know — allergies, strong preferences…"
          rows={3}
          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-base text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0d3c54] resize-none"
        />
      </div>

      <div className="flex flex-col gap-3">
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-full bg-[#0d3c54] py-3 text-sm font-bold text-white hover:bg-[#0d3c54]/90 transition-colors disabled:opacity-50"
        >
          {pending ? <span className="flex items-center justify-center gap-2">Saving <LoadingDots /></span> : "Save preferences"}
        </button>

        {showSkip && (
          <button
            type="button"
            disabled={pending}
            onClick={() => startTransition(() => skipDietaryPreferences(redirectTo))}
            className="w-full rounded-full border border-gray-200 py-3 text-sm font-bold text-gray-500 hover:border-[#0d3c54]/30 transition-colors disabled:opacity-50"
          >
            Skip for now
          </button>
        )}
      </div>
    </form>
  );
}
