import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import RocksGlass from "@/components/icons/rocks-glass";
import WelcomeCTAs from "./client";

export default async function WelcomePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <main className="min-h-screen bg-[#0d3c54] flex flex-col items-center justify-center px-6 gap-10">
      {/* Wordmark */}
      <h1 className="font-[family-name:var(--font-abhaya-libre)] text-6xl font-bold text-white tracking-widest select-none">
        ricked
      </h1>

      {/* Rick intro card */}
      <div className="w-full max-w-sm bg-white/10 rounded-3xl p-6 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#551904] flex items-center justify-center flex-shrink-0">
            <RocksGlass size={20} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">Rick</p>
            <p className="text-xs text-white/50">AI mixologist</p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-base text-white leading-relaxed">Hey. I&apos;m Rick.</p>
          <p className="text-sm text-white/80 leading-relaxed">
            I know a lot about whiskey and cocktails. Tell me what you&apos;ve got and I&apos;ll
            help you figure out what to make.
          </p>
          <p className="text-sm text-white/80 leading-relaxed">
            No snobbery. Fish sauce welcome.
          </p>
        </div>
      </div>

      {/* Client component handles update() before navigating to avoid stale JWT */}
      <WelcomeCTAs />
    </main>
  );
}
