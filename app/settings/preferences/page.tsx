import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import AppBar from "@/components/app-bar";
import BottomNav from "@/components/bottom-nav";
import DietaryPreferencesForm from "@/components/dietary-preferences-form";
// FUTURE: add spirit preferences, notification settings, and account settings here

export default async function SettingsPreferencesPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const [user, { saved }] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { dietaryRestrictions: true, dietaryNotes: true },
    }),
    searchParams,
  ]);

  return (
    <div className="flex flex-col min-h-screen bg-[#fffbfa]">
      <AppBar title="Preferences" showBack />

      <main className="flex-1 pb-24 px-4 pt-4 max-w-lg mx-auto w-full">
        {saved === "1" && (
          <div className="mb-4 rounded-xl bg-green-50 border border-green-200 px-4 py-3">
            <p className="text-sm font-bold text-green-700">Preferences saved.</p>
          </div>
        )}

        <section className="mb-6">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#0d3c54] mb-4">
            Dietary restrictions
          </h2>
          <DietaryPreferencesForm
            current={user?.dietaryRestrictions ?? []}
            currentNotes={user?.dietaryNotes ?? ""}
            redirectTo="/settings/preferences"
            showSkip={false}
          />
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
