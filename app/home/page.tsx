import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import AppBar from "@/components/app-bar";
import SignOutButton from "@/components/sign-out-button";

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <div className="flex flex-col min-h-screen bg-[#fffbfa]">
      <AppBar />

      <main className="flex-1 flex flex-col items-center justify-center px-5 py-10 gap-4 text-center">
        <p className="text-sm text-gray-500">
          Signed in as{" "}
          <span className="font-bold text-[#0d3c54]">{session.user?.email}</span>
        </p>

        <h2 className="font-[family-name:var(--font-abhaya-libre)] text-2xl font-bold text-[#0d3c54]">
          The feed is coming in Phase 3.
        </h2>
        <p className="text-sm text-gray-500 max-w-xs">
          Auth is working — pour one and hang tight while we build the good stuff.
        </p>

        <SignOutButton />
      </main>
    </div>
  );
}
