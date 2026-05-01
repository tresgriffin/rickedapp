"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { uploadFile } from "@/lib/upload";

export async function createReview(
  formData: FormData
): Promise<{ ok: true; whiskeyId: string } | { error: string }> {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "You need to be signed in to leave a review." };

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
    mediaUrl = await uploadFile(mediaFile);
  }

  await prisma.review.create({
    data: {
      userId: session.user.id,
      whiskeyId,
      rating,
      body,
      mediaUrl,
      status: "APPROVED",
    },
  });

  return { ok: true as const, whiskeyId };
}
