import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import AppBar from "@/components/app-bar";
import BottomNav from "@/components/bottom-nav";

export default async function AboutPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <div className="flex flex-col min-h-screen bg-[#fffbfa]">
      <AppBar showBack title="About Ricked" />

      <main className="flex-1 pb-20 px-5 pt-6 flex flex-col gap-4 max-w-lg mx-auto w-full">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-5 flex flex-col gap-2">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#0d3c54]">What is Ricked</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            Ricked is a recipe-first whiskey and cocktail app for people who enjoy drinking without the gatekeeping. Discover recipes, share what you&apos;re making, and build new ones.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-5 flex flex-col gap-2">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#0d3c54]">About Rick</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            Rick is Ricked&apos;s resident mixologist. He&apos;s an AI character powered by Claude. He knows the recipes, and he&apos;ll help you build new ones.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-5 flex flex-col gap-2">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#0d3c54]">Feedback</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            Have feedback?{" "}
            <a
              href="mailto:rickedapp@gmail.com"
              className="font-bold text-[#551904] hover:underline"
            >
              rickedapp@gmail.com
            </a>
          </p>
        </div>

        <p className="text-xs text-gray-400 text-center">
          <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
          {" · "}
          <Link href="/terms" className="hover:underline">Terms of Service</Link>
        </p>

        <p className="text-xs text-gray-400 text-center">Closed beta · May 2026</p>
      </main>

      <BottomNav />
    </div>
  );
}
