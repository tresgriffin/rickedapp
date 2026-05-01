export default function LoadingCard() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-[2px]">
      <div className="bg-white rounded-2xl px-8 py-5 shadow-lg flex flex-col items-center gap-2">
        <span className="text-2xl select-none" aria-hidden="true">🥃</span>
        <p className="text-sm font-bold text-[#0d3c54]">Loading…</p>
      </div>
    </div>
  );
}
