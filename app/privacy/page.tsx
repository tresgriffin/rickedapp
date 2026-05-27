import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import AppBar from "@/components/app-bar";
import BottomNav from "@/components/bottom-nav";
import BackButton from "@/components/back-button";
import TermlyEmbed from "@/components/termly-embed";

export default async function PrivacyPage() {
  const session = await getServerSession(authOptions);

  return (
    <div className="flex flex-col min-h-screen bg-[#fffbfa]">
      <AppBar plain />

      <main className={`flex-1 px-5 py-8 max-w-3xl mx-auto w-full ${session ? "pb-nav" : ""}`}>
        <BackButton fallback={session ? "/more" : "/login"} />

        <h1 className="font-[family-name:var(--font-abhaya-libre)] text-3xl font-bold text-[#0d3c54] mb-8">
          Privacy Policy
        </h1>

        <TermlyEmbed dataId="7c604ea3-385b-455b-8ecd-fa415504c9c2" />
      </main>

      {session && <BottomNav />}
    </div>
  );
}
