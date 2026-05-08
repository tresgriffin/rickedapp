"use server";

import { prisma } from "@/lib/db";
import { uploadFile } from "@/lib/upload";
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
    mediaUrl = await uploadFile(mediaFile);
  }

  await prisma.post.create({
    data: {
      userId: auth.userId,
      body,
      taggedWhiskeyId,
      mediaUrl,
      status: "APPROVED",
    },
  });

  return { ok: true as const };
}
