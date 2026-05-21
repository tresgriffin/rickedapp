import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import AppBar from "@/components/app-bar";
import EditRecipeClient from "./client";

export default async function EditRecipePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;

  const recipe = await prisma.recipe.findUnique({
    where: { id },
    select: {
      id: true,
      userId: true,
      title: true,
      description: true,
      ingredients: true,
      steps: true,
      mediaUrl: true,
      taggedWhiskeyId: true,
      taggedWhiskey: { select: { id: true, name: true, brand: true } },
    },
  });

  if (!recipe) notFound();
  // Ownership check — canonicals (Rick's recipes) fail here since Rick's userId !== session.user.id
  if (recipe.userId !== session.user.id) notFound();

  return (
    <div className="flex flex-col min-h-screen bg-[#fffbfa]">
      <AppBar title="Edit recipe" showBack />
      <EditRecipeClient recipe={recipe} />
    </div>
  );
}
