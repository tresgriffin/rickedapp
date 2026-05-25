import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import DietaryPreferencesForm from "@/components/dietary-preferences-form";

export default async function DietaryPreferencesPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { dietaryRestrictions: true, dietaryNotes: true, dietaryPreferencesSet: true },
  });

  const { redirectTo } = await searchParams;

  return (
    <div className="min-h-screen bg-[#fffbfa] flex flex-col pt-[env(safe-area-inset-top)]">
      <div className="flex-1 px-4 py-8 max-w-lg mx-auto w-full">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#0d3c54] mb-2">Dietary preferences</h1>
          <p className="text-sm text-gray-500">
            Rick uses this to avoid flagging every drink for ingredients you&apos;re already fine with — or to flag the ones you&apos;re not.
          </p>
        </div>

        <DietaryPreferencesForm
          current={user?.dietaryRestrictions ?? []}
          currentNotes={user?.dietaryNotes ?? ""}
          redirectTo={redirectTo ?? "/rick"}
          showSkip={!user?.dietaryPreferencesSet}
        />
      </div>
    </div>
  );
}
