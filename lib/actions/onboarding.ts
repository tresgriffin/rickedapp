"use server";

import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { WhiskeyInterest } from "@/app/generated/prisma/client";
import { validateHandleFormat } from "@/lib/handle-validation";

async function markSeen() {
  const session = await getServerSession(authOptions);
  if (!session) return;
  await prisma.user.update({
    where: { id: session.user.id },
    data: { hasSeenRickOnboarding: true },
  });
}

/** Marks onboarding seen and redirects to Rick chat. */
export async function goToRick() {
  await markSeen();
  redirect("/rick");
}

/** Marks onboarding seen and redirects to the home feed. */
export async function goToHome() {
  await markSeen();
  redirect("/home");
}

/**
 * Marks the Rick handshake as seen without redirecting.
 * Used by the /welcome client component so update() can run before navigation,
 * ensuring the JWT cookie is current when middleware checks the destination route.
 */
export async function markRickHandshakeSeen(): Promise<void> {
  await markSeen();
}

// ─── Age verification ─────────────────────────────────────────────────────

function calculateAge(dob: Date): number {
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}

export async function submitAgeVerification(
  formData: FormData
): Promise<{ error: string } | { ok: true }> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "Not signed in." };

  const dob = formData.get("dateOfBirth") as string | null;
  if (!dob) return { error: "Please enter your date of birth." };

  const parsed = new Date(dob);
  if (isNaN(parsed.getTime())) return { error: "Invalid date. Please try again." };

  const age = calculateAge(parsed);
  if (age < 21) {
    // FUTURE: Phase 8b — Level 3 age verification (Yoti, Persona, Veriff) could slot in here
    // for markets requiring stricter identity-backed verification.
    return { error: "You need to be 21 or older to use Ricked." };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { dateOfBirth: parsed },
  });

  // Client calls update() then router.push() — redirect() here prevents update() from running
  return { ok: true };
}

// ─── Handle picker ────────────────────────────────────────────────────────

export async function submitHandle(
  formData: FormData
): Promise<{ error: string } | { ok: true }> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "Not signed in." };

  const raw = (formData.get("handle") as string | null) ?? "";
  const handle = raw.trim().toLowerCase();

  const formatError = validateHandleFormat(handle);
  if (formatError) return { error: formatError };

  const existing = await prisma.user.findFirst({
    where: {
      handle: { equals: handle, mode: "insensitive" },
      NOT: { id: session.user.id },
    },
    select: { id: true },
  });

  if (existing) return { error: "That handle is taken." };

  await prisma.user.update({
    where: { id: session.user.id },
    data: { handle, hasPickedHandle: true },
  });

  // FUTURE: Phase 8b — when users change handles post-onboarding, audit all
  // profile URLs and social graph links that reference the old handle.

  // Client calls update() then router.push() — redirect() here prevents update() from running
  return { ok: true };
}

// ─── Whiskey interest ─────────────────────────────────────────────────────

const VALID_INTERESTS: WhiskeyInterest[] = [
  "BOURBON", "SCOTCH", "RYE", "JAPANESE", "IRISH", "NOT_SURE",
];

export async function submitWhiskeyInterest(
  formData: FormData
): Promise<{ ok: true }> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { ok: true }; // silently pass — gate already enforced by middleware

  const raw = formData.get("interest") as string | null;

  if (raw && VALID_INTERESTS.includes(raw as WhiskeyInterest)) {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { whiskeyInterest: raw as WhiskeyInterest },
    });
  }

  // Client calls update() then router.push() — redirect() here prevents update() from running
  return { ok: true };
}

/** Settings-context version — saves whiskey interest without redirecting. */
export async function updateWhiskeyInterest(
  interest: WhiskeyInterest | null
): Promise<void> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return;

  await prisma.user.update({
    where: { id: session.user.id },
    data: { whiskeyInterest: interest },
  });
}

// ─── Profile edit ─────────────────────────────────────────────────────────

export async function updateProfile(
  formData: FormData
): Promise<{ error: string } | never> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const displayName = ((formData.get("displayName") as string | null) ?? "").trim();
  const bio = ((formData.get("bio") as string | null) ?? "").trim() || null;

  if (!displayName) return { error: "Display name can't be empty." };
  if (displayName.length > 50) return { error: "Display name must be 50 characters or fewer." };

  await prisma.user.update({
    where: { id: session.user.id },
    data: { displayName, bio },
  });

  redirect("/profile");
}
