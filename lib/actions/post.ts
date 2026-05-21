"use server";

import { del } from "@vercel/blob";
import { prisma } from "@/lib/db";
import { uploadFile, UploadError } from "@/lib/upload";
import { requireVerifiedUser } from "@/lib/require-verified";

export async function createPost(
  formData: FormData
): Promise<{ ok: true } | { error: string }> {
  const auth = await requireVerifiedUser();
  if ("error" in auth) return auth;

  const body = ((formData.get("body") as string | null) ?? "").trim();
  const taggedWhiskeyId = (formData.get("taggedWhiskeyId") as string | null)?.trim() || null;
  const mediaFile = formData.get("media") as File | null;

  if (!body) return { error: "Write something first." };

  let mediaUrl: string | null = null;
  if (mediaFile && mediaFile.size > 0) {
    try {
      mediaUrl = await uploadFile(mediaFile);
    } catch (err) {
      return { error: err instanceof UploadError ? err.message : "Upload failed. Try again." };
    }
  }

  try {
    await prisma.post.create({
      data: {
        userId: auth.userId,
        body,
        taggedWhiskeyId,
        mediaUrl,
        status: "APPROVED",
      },
    });
  } catch {
    if (mediaUrl) await del(mediaUrl).catch(() => {}); // best-effort blob cleanup
    return { error: "Something went wrong saving your post. Please try again." };
  }

  return { ok: true as const };
}

export async function updatePost(
  postId: string,
  formData: FormData
): Promise<{ ok: true } | { error: string }> {
  const auth = await requireVerifiedUser();
  if ("error" in auth) return auth;

  const existing = await prisma.post.findUnique({
    where: { id: postId },
    select: { userId: true, mediaUrl: true },
  });
  if (!existing) return { error: "Post not found." };
  if (existing.userId !== auth.userId) return { error: "Not your post." };

  const body = ((formData.get("body") as string | null) ?? "").trim();
  const taggedWhiskeyId = (formData.get("taggedWhiskeyId") as string | null)?.trim() || null;
  const mediaFile = formData.get("media") as File | null;
  const deleteMedia = formData.get("deleteMedia") === "true";

  if (!body) return { error: "Write something first." };

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
    await prisma.post.update({
      where: { id: postId },
      data: { body, taggedWhiskeyId, mediaUrl },
    });
  } catch {
    return { error: "Something went wrong saving your post. Please try again." };
  }

  return { ok: true as const };
}
