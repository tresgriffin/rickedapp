"use client";

export default function WhiskeyError({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-6 text-center bg-[#fffbfa]">
      <span className="text-4xl" aria-hidden="true">😬</span>
      <p className="text-sm font-bold text-[#0d3c54]">Something went wrong loading this page.</p>
      <p className="text-xs text-gray-500">It&apos;s not you — Rick&apos;s looking into it.</p>
      <button
        type="button"
        onClick={reset}
        className="mt-2 rounded-full bg-[#0d3c54] px-6 py-2.5 text-sm font-bold text-white"
      >
        Try again
      </button>
    </div>
  );
}
