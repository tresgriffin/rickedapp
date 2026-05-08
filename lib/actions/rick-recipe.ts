"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { requireVerifiedUser } from "@/lib/require-verified";

interface RickRecipeIngredient {
  name: string;
  amount: string;
  unit: string | null;
  notes: string | null;
}

interface RickRecipeStep {
  order: number;
  instruction: string;
}

interface RickRecipeJson {
  title: string;
  description: string;
  difficulty: "EASY" | "MEDIUM" | "ADVANCED";
  ingredients: RickRecipeIngredient[];
  steps: RickRecipeStep[];
  rickNote: string | null;
  safetyFlags: string[];
}

// Called from the Rick chat UI when a recipe is generated.
// Creates an unpublished AI draft recipe and returns its ID.
export async function saveRickRecipe(
  conversationId: string,
  recipeJson: RickRecipeJson
): Promise<{ id: string } | { error: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "Unauthorized" };

  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, userId: session.user.id },
  });
  if (!conversation) return { error: "Conversation not found" };

  // Normalize ingredient shape to match what recipe detail page expects
  const ingredients = recipeJson.ingredients.map((i) => ({
    amount: [i.amount, i.unit].filter(Boolean).join(" "),
    item: i.name,
    notes: i.notes ?? undefined,
  }));

  const steps = recipeJson.steps
    .sort((a, b) => a.order - b.order)
    .map((s) => s.instruction);

  // Auto-tag: find a whiskey from the Whiskey table whose canonical name is
  // contained within any ingredient name (case-insensitive). Server-side bridging
  // so Rick doesn't need to know whiskey IDs.
  // Longest-match wins to avoid short names (e.g. "Old") matching inside longer
  // ingredient strings (e.g. "Old Fashioned syrup") unintentionally.
  const ingredientNames = recipeJson.ingredients.map((i) => i.name.toLowerCase());
  const allWhiskeys = await prisma.whiskey.findMany({
    select: { id: true, name: true },
  });
  const matchedWhiskey = allWhiskeys
    .filter((w) => ingredientNames.some((name) => name.includes(w.name.toLowerCase())))
    .sort((a, b) => b.name.length - a.name.length)[0] ?? null;

  const recipe = await prisma.recipe.create({
    data: {
      userId: session.user.id,
      title: recipeJson.title,
      description: recipeJson.description,
      ingredients,
      steps,
      isAiGenerated: true,
      isPublished: false,
      sourceConversationId: conversationId,
      taggedWhiskeyId: matchedWhiskey?.id ?? null,
      status: "APPROVED",
    },
    select: { id: true },
  });

  return { id: recipe.id };
}

// Called from the "I made this" publish flow.
// Requires at least a star rating and a verified email before publishing.
export async function publishRickRecipe(
  recipeId: string,
  stars: number,
  wouldMakeAgain: boolean | null
): Promise<{ ok: true } | { error: string }> {
  const auth = await requireVerifiedUser();
  if ("error" in auth) return auth;

  const recipe = await prisma.recipe.findFirst({
    where: { id: recipeId, userId: auth.userId, isAiGenerated: true, isPublished: false },
  });
  if (!recipe) return { error: "Recipe not found or already published" };

  if (!stars || stars < 1 || stars > 5) return { error: "A star rating is required to publish" };

  await prisma.$transaction([
    prisma.recipe.update({
      where: { id: recipeId },
      data: { isPublished: true },
    }),
    prisma.recipeRating.upsert({
      where: { userId_recipeId: { userId: auth.userId, recipeId } },
      create: {
        userId: auth.userId,
        recipeId,
        stars,
        wouldMakeAgain,
      },
      update: { stars, wouldMakeAgain },
    }),
  ]);

  revalidatePath(`/recipe/${recipeId}`, "page");
  revalidatePath("/profile", "layout");
  redirect(`/recipe/${recipeId}`);
}
