import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { timeAgo } from "@/lib/format";
import AppBar from "@/components/app-bar";
import BottomNav from "@/components/bottom-nav";
import Avatar from "@/components/avatar";

interface Ingredient {
  amount: string;
  item: string;
}

export default async function RecipePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const { id } = await params;

  const recipe = await prisma.recipe.findUnique({
    where: { id },
    include: {
      user: {
        select: { handle: true, displayName: true, avatarUrl: true },
      },
    },
  });

  if (!recipe) notFound();

  const ingredients = recipe.ingredients as unknown as Ingredient[];
  const steps = recipe.steps as unknown as string[];
  const backHref = recipe.user.handle
    ? `/profile/${recipe.user.handle}`
    : "/profile";

  return (
    <div className="flex flex-col min-h-screen bg-[#fffbfa]">
      <AppBar />

      <main className="flex-1 pb-20">
        {/* Header */}
        <div className="bg-white border-b border-gray-100 px-4 pt-5 pb-5 flex flex-col gap-4">
          <Link
            href={backHref}
            className="flex items-center gap-1 text-sm text-[#551904] font-bold w-fit"
          >
            <ChevronLeft size={16} />
            {recipe.user.displayName ?? recipe.user.handle ?? "Profile"}
          </Link>

          <h1 className="font-[family-name:var(--font-abhaya-libre)] text-2xl font-bold text-[#0d3c54] leading-tight">
            {recipe.title}
          </h1>

          {recipe.description && (
            <p className="text-sm text-gray-600 leading-relaxed">{recipe.description}</p>
          )}

          {/* Author */}
          <Link
            href={recipe.user.handle ? `/profile/${recipe.user.handle}` : "#"}
            className="flex items-center gap-2 w-fit"
          >
            <Avatar
              displayName={recipe.user.displayName}
              avatarUrl={recipe.user.avatarUrl}
              size="sm"
            />
            <div>
              <p className="text-xs font-bold text-[#0d3c54]">
                {recipe.user.displayName ?? recipe.user.handle}
              </p>
              <p className="text-[11px] text-gray-400">
                {timeAgo(recipe.createdAt)}
              </p>
            </div>
          </Link>
        </div>

        {/* Photo */}
        {recipe.mediaUrl && (
          <div className="relative aspect-[4/3] bg-gray-100">
            <Image
              src={recipe.mediaUrl}
              alt={`${recipe.title} photo`}
              fill
              sizes="(max-width: 640px) 100vw, 600px"
              className="object-cover"
            />
          </div>
        )}

        <div className="px-4 pt-5 pb-2 flex flex-col gap-6">
          {/* Ingredients */}
          <section>
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#0d3c54] mb-3">
              Ingredients
            </h2>
            <ul className="flex flex-col gap-2">
              {ingredients.map((ing, i) => (
                <li key={i} className="flex items-baseline gap-3 text-sm">
                  <span className="font-bold text-[#551904] flex-shrink-0 w-14 text-right">
                    {ing.amount}
                  </span>
                  <span className="text-black">{ing.item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Steps */}
          <section>
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#0d3c54] mb-3">
              Steps
            </h2>
            <ol className="flex flex-col gap-4">
              {steps.map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span className="text-xs font-bold text-[#551904] flex-shrink-0 mt-0.5 w-5 text-right">
                    {i + 1}.
                  </span>
                  <p className="text-sm text-black leading-relaxed">{step}</p>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
