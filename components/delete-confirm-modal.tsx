"use client";

import LoadingDots from "@/components/loading-dots";

interface DeleteConfirmModalProps {
  type: "recipe" | "post" | "conversation" | "review";
  onConfirm: () => void;
  onCancel: () => void;
  deleting: boolean;
  error: string;
}

export default function DeleteConfirmModal({
  type,
  onConfirm,
  onCancel,
  deleting,
  error,
}: DeleteConfirmModalProps) {
  const labels: Record<typeof type, { heading: string; body: string }> = {
    recipe:       { heading: "Delete this recipe?",       body: "All reviews will also be removed. This can't be undone." },
    post:         { heading: "Delete this post?",         body: "This can't be undone." },
    conversation: { heading: "Delete this conversation?", body: "This can't be undone." },
    review:       { heading: "Delete this review?",       body: "This can't be undone." },
  };
  const { heading, body } = labels[type];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm flex flex-col gap-4 shadow-xl">
        <div>
          <h2 className="text-base font-bold text-[#0d3c54] mb-1">{heading}</h2>
          <p className="text-sm text-gray-500">{body}</p>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="w-full rounded-full bg-red-600 py-3 text-sm font-bold text-white hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {deleting
              ? <span className="flex items-center justify-center gap-2">Deleting <LoadingDots /></span>
              : "Delete"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={deleting}
            className="w-full rounded-full border border-gray-200 py-3 text-sm font-bold text-gray-500 hover:border-gray-300 transition-colors disabled:opacity-40"
          >
            Keep it
          </button>
        </div>
      </div>
    </div>
  );
}
