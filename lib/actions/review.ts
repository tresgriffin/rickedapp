"use server";

import { del } from "@vercel/blob";
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
  const body = ((formData.get("body") as string | null) ?? "").trim() || null;
  const mediaFile = formData.get("media") as File | null;

  if (!whiskeyId) return { error: "No whiskey selected." };

  const rating = parseInt(ratingRaw ?? "0", 10);
  if (!rating || rating < 1 || rating > 5) {
    return { error: "Pick a star rating before you post." };
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

  try {
    // Upsert: a second submit on the same bottle updates the existing review.
    // Unique constraint @@unique([userId, whiskeyId]) enforces one per user per bottle.
    await prisma.review.upsert({
      where: { userId_whiskeyId: { userId: auth.userId, whiskeyId } },
      create: { userId: auth.userId, whiskeyId, rating, body, mediaUrl, status: "APPROVED" },
      update: { rating, body, mediaUrl, status: "APPROVED" },
    });
  } catch {
    if (mediaUrl) await del(mediaUrl).catch(() => {});
    return { error: "Something went wrong saving your review. Please try again." };
  }

  return { ok: true as const, whiskeyId };
}

export async function updateReview(
  reviewId: string,
  formData: FormData
): Promise<{ ok: true } | { error: string }> {
  const auth = await requireVerifiedUser();
  if ("error" in auth) return auth;

  const existing = await prisma.review.findUnique({
    where: { id: reviewId },
    select: { userId: true, mediaUrl: true },
  });
  if (!existing) return { error: "Review not found." };
  if (existing.userId !== auth.userId) return { error: "Not your review." };

  const ratingRaw = formData.get("rating") as string | null;
  const rating = parseInt(ratingRaw ?? "0", 10);
  if (!rating || rating < 1 || rating > 5) {
    return { error: "Pick a star rating before you save." };
  }

  const body = ((formData.get("body") as string | null) ?? "").trim() || null;
  const mediaFile = formData.get("media") as File | null;
  const clearMedia = formData.get("clearMedia") === "true";

  let mediaUrl = existing.mediaUrl;
  if (clearMedia) {
    if (existing.mediaUrl) await del(existing.mediaUrl).catch(() => {});
    mediaUrl = null;
  } else if (mediaFile && mediaFile.size > 0) {
    try {
      if (existing.mediaUrl) await del(existing.mediaUrl).catch(() => {});
      mediaUrl = await uploadFile(mediaFile);
    } catch (err) {
      return { error: err instanceof UploadError ? err.message : "Upload failed. Try again." };
    }
  }

  await prisma.review.update({
    where: { id: reviewId },
    data: { rating, body, mediaUrl },
  });

  return { ok: true as const };
}

export async function deleteReview(
  reviewId: string
): Promise<{ ok: true } | { error: string }> {
  const auth = await requireVerifiedUser();
  if ("error" in auth) return auth;

  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    select: { userId: true, mediaUrl: true },
  });
  if (!review) return { error: "Review not found." };
  if (review.userId !== auth.userId) return { error: "Not your review." };

  if (review.mediaUrl) await del(review.mediaUrl).catch(() => {});
  await prisma.review.delete({ where: { id: reviewId } });
  return { ok: true as const };
}
