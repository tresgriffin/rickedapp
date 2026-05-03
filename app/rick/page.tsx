import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import BottomNav from "@/components/bottom-nav";
import RocksGlass from "@/components/icons/rocks-glass";

const SUGGESTION_CHIPS = [
  "I have Buffalo Trace",
  "Surprise me",
  "Something refreshing",
  "Help with my recipe",
];

export default async function RickPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <div className="flex flex-col min-h-screen bg-[#fffbfa]">
      {/* Custom header for Rick context */}
      <header className="sticky top-0 z-20 bg-[#0d3c54] px-4 py-3 flex items-center gap-3 shadow-sm">
        <div className="w-8 h-8 rounded-full bg-[#551904] flex items-center justify-center flex-shrink-0">
          <RocksGlass size={16} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-white leading-none">Rick</p>
          <p className="text-[10px] text-white/50 leading-none mt-0.5">AI mixologist</p>
        </div>
      </header>

      <main className="flex-1 pb-20 flex flex-col">
        {/* Rick's placeholder opening message */}
        <div className="px-4 pt-6 flex gap-3">
          <div className="w-8 h-8 rounded-full bg-[#551904] flex items-center justify-center flex-shrink-0 mt-0.5">
            <RocksGlass size={14} className="text-white" />
          </div>
          <div className="flex-1">
            <div className="bg-white rounded-2xl rounded-tl-sm border border-gray-100 shadow-sm px-4 py-3 max-w-sm">
              <p className="text-sm text-black leading-relaxed">
                I&apos;m almost ready. Full chat is coming soon.
              </p>
              <p className="text-sm text-black leading-relaxed mt-1">
                In the meantime, check out the recipe feed. Tag me when you&apos;re making
                something.
              </p>
            </div>
            <p className="text-[10px] text-gray-400 mt-1 ml-1">Rick</p>
          </div>
        </div>

        {/* Suggestion chips */}
        <div className="px-4 pt-5">
          <p className="text-xs text-gray-400 mb-2">Try asking:</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTION_CHIPS.map((chip) => (
              <button
                key={chip}
                type="button"
                disabled
                title="Coming soon"
                className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-400 cursor-not-allowed"
              >
                {chip}
              </button>
            ))}
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Disabled input */}
        <div className="px-4 pb-4 border-t border-gray-100 pt-3 bg-[#fffbfa]">
          <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-3">
            <span className="flex-1 text-sm text-gray-400">Chat coming soon…</span>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
