"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendEmailChangeVerification } from "@/lib/email";

const RATE_LIMIT_MS = 60 * 60 * 1000; // 1 hour

export async function requestEmailChange(
  formData: FormData
): Promise<{ ok: true } | { error: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "Not signed in." };

  const newEmail = ((formData.get("email") as string | null) ?? "").toLowerCase().trim();

  // Basic format check
  if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
    return { error: "Please enter a valid email address." };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      email: true,
      hashedPassword: true,
      pendingEmailRequestedAt: true,
    },
  });

  if (!user) return { error: "User not found." };

  // Block OAuth-only accounts (no password = Google sign-in only)
  if (!user.hashedPassword) {
    return { error: "Your account uses Google sign-in. To change your email, update it in your Google account." };
  }

  // No change
  if (newEmail === user.email) {
    return { error: "That's already your current email." };
  }

  // Rate limit: one request per hour
  if (user.pendingEmailRequestedAt) {
    const elapsed = Date.now() - user.pendingEmailRequestedAt.getTime();
    if (elapsed < RATE_LIMIT_MS) {
      const minutesLeft = Math.ceil((RATE_LIMIT_MS - elapsed) / 60000);
      return { error: `Please wait ${minutesLeft} minute${minutesLeft === 1 ? "" : "s"} before requesting another email change.` };
    }
  }

  // Check target email isn't already taken by a verified account
  const existing = await prisma.user.findUnique({
    where: { email: newEmail },
    select: { id: true, emailVerified: true },
  });

  if (existing && existing.id !== session.user.id) {
    return { error: "That email is associated with another account." };
  }

  // Invalidate any prior pending token for this user
  await prisma.verificationToken.deleteMany({
    where: { identifier: `email-change:${session.user.id}` },
  });

  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24 hours

  await prisma.$transaction([
    prisma.verificationToken.create({
      data: {
        identifier: `email-change:${session.user.id}`,
        token,
        expires,
      },
    }),
    prisma.user.update({
      where: { id: session.user.id },
      data: {
        pendingEmail: newEmail,
        pendingEmailRequestedAt: new Date(),
      },
    }),
  ]);

  // Send verification to the NEW address
  await sendEmailChangeVerification(newEmail, token);

  revalidatePath("/profile/edit");
  return { ok: true };
}

export async function cancelEmailChange(): Promise<void> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return;

  await prisma.$transaction([
    prisma.verificationToken.deleteMany({
      where: { identifier: `email-change:${session.user.id}` },
    }),
    prisma.user.update({
      where: { id: session.user.id },
      data: { pendingEmail: null, pendingEmailRequestedAt: null },
    }),
  ]);

  revalidatePath("/profile/edit");
}
