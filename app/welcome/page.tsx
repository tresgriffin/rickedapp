import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import Image from "next/image";
import WelcomeCTAs from "./client";

export default async function WelcomePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <>
      <style>{`html, body { background: #0d3c54; }`}</style>
      <main className="flex-1 min-h-dvh bg-[#0d3c54] flex flex-col items-center justify-center px-6 gap-10">
      {/* Wordmark */}
      <Image
        src="/ricked-assets/ricked-lockup-horizontal-light.svg"
        alt="Ricked"
        width={3289}
        height={850}
        className="h-10 w-auto"
        priority
      />

      {/* Rick intro card */}
      <div className="w-full max-w-sm bg-white/10 rounded-3xl p-6 flex flex-col items-center gap-4">
        <Image
          src="/ricked-assets/rick-handshake-avatar.png"
          alt="Rick"
          width={160}
          height={160}
          className="w-40 h-40 rounded-full object-cover"
        />
        <div className="text-center">
          <p className="text-sm font-bold text-white">Rick</p>
          <p className="text-xs text-white/50">Resident mixologist</p>
        </div>

        <div className="flex flex-col gap-2 w-full">
          <p className="font-[family-name:var(--font-abhaya-libre)] text-xl font-bold text-white leading-relaxed">Hey, I&apos;m Rick!</p>
          <p className="text-sm text-white/80 leading-relaxed">
            I know a lot about whiskey and cocktails. Tell me what you&apos;ve got and I&apos;ll
            help you figure out what to make.
          </p>
          <p className="text-sm text-white/80 leading-relaxed">
            No snobbery. All questions welcome.
          </p>
        </div>
      </div>

      {/* Client component handles update() before navigating to avoid stale JWT */}
      <WelcomeCTAs />

      <p className="text-xs text-white/40 text-center">Rick is an AI mixologist character, powered by Claude</p>
    </main>
    </>
  );
}
