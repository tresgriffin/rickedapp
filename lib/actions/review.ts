"use server";

import { prisma } from "@/lib/db";
import { uploadFile, UploadError } from "@/lib/upload";
import { requireVerifiedUser } from "@/lib/require-verified";

export async function createReview(
  formData: FormData
): Promise<{ ok: true; whiskeyId: string } | { error: string }> {
  const auth = await requireVerifiedUser();
  if ("error" in auth) return auth;

  const whiskeyId = (formData.get("whiskeyId") as string | null)?.trim();
  const ratingRaw = formData.get("rating") as string | null;
  const body = ((formData.get("body") as string | null) ?? "").trim();
  const mediaFile = formData.get("media") as File | null;

  if (!whiskeyId) return { error: "No whiskey selected." };

  const rating = parseInt(ratingRaw ?? "0", 10);
  if (!rating || rating < 1 || rating > 5) {
    return { error: "Pick a star rating before you post." };
  }
  if (body.length < 10) {
    return { error: "Write at least 10 characters. Plain language is fine." };
  }

  const whiskey = await prisma.whiskey.findUnique({ where: { id: whiskeyId } });
  if (!whiskey) return { error: "That whiskey wasn't found. Try again." };

  let mediaUrl: string | null = null;
  if (mediaFile && mediaFile.size > 0) {
    try {
      mediaUrl = await uploadFile(mediaFile);
    } catch (err) {
      return { error: err instanceof UploadError ? err.message : "Upload failed. Try again." };
    }
  }

  await prisma.review.create({
    data: {
      userId: auth.userId,
      whiskeyId,
      rating,
      body,
      mediaUrl,
      status: "APPROVED",
    },
  });

  return { ok: true as const, whiskeyId };
}
