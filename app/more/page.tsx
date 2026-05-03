import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import AppBar from "@/components/app-bar";
import BottomNav from "@/components/bottom-nav";
import SignOutButton from "@/components/sign-out-button";

function PlaceholderItem({ label, note }: { label: string; note: string }) {
  return (
    <div className="flex items-center justify-between bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-4">
      <span className="text-sm font-bold text-gray-400">{label}</span>
      <span className="text-xs text-gray-300">{note}</span>
    </div>
  );
}

export default async function MorePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <div className="flex flex-col min-h-screen bg-[#fffbfa]">
      <AppBar plain />

      <main className="flex-1 pb-20 px-5 pt-6 flex flex-col gap-3 max-w-lg mx-auto w-full">
        <h1 className="font-[family-name:var(--font-abhaya-libre)] text-2xl font-bold text-[#0d3c54] mb-2">
          More
        </h1>

        <PlaceholderItem
          label="Settings"
          note="Coming soon"
        />
        <PlaceholderItem
          label="About Ricked"
          note="Coming soon"
        />
        <PlaceholderItem
          label="Help"
          note="Coming soon"
        />

        <div className="mt-4">
          <SignOutButton />
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
