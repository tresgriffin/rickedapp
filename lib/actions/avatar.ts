"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { uploadFile, UploadError } from "@/lib/upload";

export async function uploadAvatar(
  formData: FormData
): Promise<{ ok: true; avatarUrl: string } | { error: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "Not signed in." };

  const file = formData.get("avatar") as File | null;
  if (!file || file.size === 0) return { error: "No file selected." };

  let avatarUrl: string;
  try {
    avatarUrl = await uploadFile(file);
  } catch (err) {
    return { error: err instanceof UploadError ? err.message : "Upload failed. Try again." };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { avatarUrl },
  });

  revalidatePath("/profile");
  return { ok: true, avatarUrl };
}
