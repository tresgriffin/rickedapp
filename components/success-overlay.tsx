"use client";

/**
 * Shown after a successful write action. Pass a variant matching the
 * action that just completed, or omit for the neutral "Done." fallback.
 *
 * Variants:
 *   "review"  — "You're in the books." / "Your review is live on the bottle page."
 *   "post"    — "Nice pour." / "Your post is up in the feed."
 *   "recipe"  — "Recipe's out." / "Others can find it on your profile."
 *   "generic" — "Done." / no subtitle (useful for future one-off success states)
 */

interface SuccessOverlayProps {
  variant?: "review" | "post" | "recipe" | "generic";
  onClose: () => void;
}

const COPY: Record<
  NonNullable<SuccessOverlayProps["variant"]>,
  { heading: string; sub: string | null }
> = {
  review: { heading: "You're in the books.", sub: "Your review is live on the bottle page." },
  post: { heading: "Nice pour.", sub: "Your post is up in the feed." },
  recipe: { heading: "Recipe's out.", sub: "Others can find it on your profile." },
  generic: { heading: "Done.", sub: null },
};

export default function SuccessOverlay({
  variant = "generic",
  onClose,
}: SuccessOverlayProps) {
  const { heading, sub } = COPY[variant];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] px-6"
      role="dialog"
      aria-modal="true"
      aria-label={heading}
    >
      <div className="bg-white rounded-2xl w-full max-w-xs p-6 flex flex-col items-center gap-3 shadow-xl">
        <span className="text-4xl select-none" aria-hidden="true">🥃</span>
        <p className="text-lg font-bold text-[#0d3c54] text-center">{heading}</p>
        {sub && <p className="text-sm text-gray-500 text-center">{sub}</p>}
        <button
          type="button"
          onClick={onClose}
          className="mt-2 w-full rounded-full bg-[#0d3c54] py-3 text-sm font-bold text-white hover:bg-[#0a2f42] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0d3c54] focus-visible:ring-offset-2"
        >
          Close
        </button>
      </div>
    </div>
  );
}
