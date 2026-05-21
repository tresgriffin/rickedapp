"use server";

import { del } from "@vercel/blob";
import { prisma } from "@/lib/db";
import { uploadFile, UploadError } from "@/lib/upload";
import { requireVerifiedUser } from "@/lib/require-verified";

interface Ingredient {
  amount: string;
  item: string;
}

export async function createRecipe(
  formData: FormData
): Promise<{ ok: true } | { error: string }> {
  const auth = await requireVerifiedUser();
  if ("error" in auth) return auth;

  const title = ((formData.get("title") as string | null) ?? "").trim();
  const description = ((formData.get("description") as string | null) ?? "").trim() || null;
  const taggedWhiskeyId = (formData.get("taggedWhiskeyId") as string | null)?.trim() || null;
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
    try {
      mediaUrl = await uploadFile(mediaFile);
    } catch (err) {
      return { error: err instanceof UploadError ? err.message : "Upload failed. Try again." };
    }
  }

  try {
    await prisma.recipe.create({
      data: {
        userId: auth.userId,
        title,
        description,
        taggedWhiskeyId,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ingredients: validIngredients as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        steps: validSteps as any,
        mediaUrl,
        status: "APPROVED",
      },
    });
  } catch {
    if (mediaUrl) await del(mediaUrl).catch(() => {}); // best-effort blob cleanup
    return { error: "Something went wrong saving your recipe. Please try again." };
  }

  return { ok: true as const };
}

export async function updateRecipe(
  recipeId: string,
  formData: FormData
): Promise<{ ok: true } | { error: string }> {
  const auth = await requireVerifiedUser();
  if ("error" in auth) return auth;

  const existing = await prisma.recipe.findUnique({
    where: { id: recipeId },
    select: { userId: true, mediaUrl: true },
  });
  if (!existing) return { error: "Recipe not found." };
  if (existing.userId !== auth.userId) return { error: "Not your recipe." };

  const title = ((formData.get("title") as string | null) ?? "").trim();
  const description = ((formData.get("description") as string | null) ?? "").trim() || null;
  const taggedWhiskeyId = (formData.get("taggedWhiskeyId") as string | null)?.trim() || null;
  const mediaFile = formData.get("media") as File | null;
  const deleteMedia = formData.get("deleteMedia") === "true";

  let ingredients: Ingredient[] = [];
  let steps: string[] = [];
  try {
    ingredients = JSON.parse((formData.get("ingredients") as string) ?? "[]");
    steps = JSON.parse((formData.get("steps") as string) ?? "[]");
  } catch {
    return { error: "Something went wrong with the recipe format. Try again." };
  }

  if (!title) return { error: "Your recipe needs a name." };

  const validIngredients = ingredients.filter((i) => i.item.trim());
  const validSteps = steps.filter((s) => s.trim());
  if (validIngredients.length === 0) return { error: "Add at least one ingredient." };
  if (validSteps.length === 0) return { error: "Add at least one step." };

  // Image: delete existing → null | upload new (deleting old) | keep existing
  let mediaUrl = existing.mediaUrl;
  if (deleteMedia) {
    if (existing.mediaUrl) await del(existing.mediaUrl).catch(() => {});
    mediaUrl = null;
  } else if (mediaFile && mediaFile.size > 0) {
    try {
      const uploaded = await uploadFile(mediaFile);
      if (existing.mediaUrl) await del(existing.mediaUrl).catch(() => {});
      mediaUrl = uploaded;
    } catch (err) {
      return { error: err instanceof UploadError ? err.message : "Upload failed. Try again." };
    }
  }

  try {
    await prisma.recipe.update({
      where: { id: recipeId },
      data: {
        title,
        description,
        taggedWhiskeyId,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ingredients: validIngredients as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        steps: validSteps as any,
        mediaUrl,
        editedAt: new Date(),
      },
    });
  } catch {
    return { error: "Something went wrong saving your changes. Please try again." };
  }

  return { ok: true as const };
}
