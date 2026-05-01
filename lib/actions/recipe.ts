"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { uploadFile } from "@/lib/upload";

interface Ingredient {
  amount: string;
  item: string;
}

export async function createRecipe(
  formData: FormData
): Promise<{ ok: true } | { error: string }> {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "You need to be signed in to share a recipe." };

  const title = ((formData.get("title") as string | null) ?? "").trim();
  const description = ((formData.get("description") as string | null) ?? "").trim() || null;
  const mediaFile = formData.get("media") as File | null;

  let ingredients: Ingredient[] = [];
  let steps: string[] = [];

  try {
    ingredients = JSON.parse((formData.get("ingredients") as string) ?? "[]");
    steps = JSON.parse((formData.get("steps") as string) ?? "[]");
  } catch {
    return { error: "Something went wrong with the recipe format. Try again." };
  }

  if (!title) return { error: "Your recipe needs a name." };
  if (ingredients.length === 0) return { error: "Add at least one ingredient." };
  if (steps.length === 0) return { error: "Add at least one step." };

  const validIngredients = ingredients.filter((i) => i.item.trim());
  const validSteps = steps.filter((s) => s.trim());

  if (validIngredients.length === 0) return { error: "Add at least one ingredient." };
  if (validSteps.length === 0) return { error: "Add at least one step." };

  let mediaUrl: string | null = null;
  if (mediaFile && mediaFile.size > 0) {
    mediaUrl = await uploadFile(mediaFile);
  }

  await prisma.recipe.create({
    data: {
      userId: session.user.id,
      title,
      description,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ingredients: validIngredients as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      steps: validSteps as any,
      mediaUrl,
      status: "APPROVED",
    },
  });

  return { ok: true as const };
}
