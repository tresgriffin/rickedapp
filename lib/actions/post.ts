"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { uploadFile } from "@/lib/upload";

export async function createPost(
  formData: FormData
): Promise<{ ok: true } | { error: string }> {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "You need to be signed in to post." };

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
      userId: session.user.id,
      body,
      taggedWhiskeyId,
      mediaUrl,
      status: "APPROVED",
    },
  });

  return { ok: true as const };
}
