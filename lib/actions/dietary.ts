"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { DietaryRestriction } from "@/app/generated/prisma/client";

const VALID_RESTRICTIONS: DietaryRestriction[] = [
  "DAIRY_FREE",
  "NUT_FREE",
  "EGG_FREE",
  "GLUTEN_FREE",
  "SULFITE_FREE",
  "VEGAN",
  "VEGETARIAN",
];

export async function updateDietaryPreferences(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return;

  const restrictions = VALID_RESTRICTIONS.filter((r) => formData.get(r) === "on");
  const notes = (formData.get("dietaryNotes") as string | null)?.trim() ?? null;
  const redirectTo = (formData.get("redirectTo") as string | null) ?? "/rick";

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      dietaryRestrictions: { set: restrictions },
      dietaryNotes: notes || null,
      dietaryPreferencesSet: true,
    },
  });

  revalidatePath("/settings/preferences");
  revalidatePath("/preferences/dietary");
  // Append ?saved=1 when redirecting back to settings so the page can show a confirmation
  const destination = redirectTo === "/settings/preferences"
    ? "/settings/preferences?saved=1"
    : redirectTo;
  redirect(destination);
}

export async function skipDietaryPreferences(redirectTo = "/rick") {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return;

  await prisma.user.update({
    where: { id: session.user.id },
    data: { dietaryPreferencesSet: true },
  });

  redirect(redirectTo);
}
