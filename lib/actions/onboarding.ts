"use server";

import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { WhiskeyInterest } from "@/app/generated/prisma/client";

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
): Promise<{ error: string } | never> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

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

  // Redirect to handle picker — session token will refresh on next request
  redirect("/onboarding/handle");
}

// ─── Handle picker ────────────────────────────────────────────────────────

const RESERVED_HANDLES = new Set([
  // Brand / team
  "admin", "support", "help", "team", "ricked", "rick", "tres", "brian",
  // Common abuse vectors
  "abuse", "billing", "contact", "info", "mail", "moderator", "mod",
  "official", "postmaster", "root", "security", "staff", "sys", "webmaster",
  "bot", "api", "null", "undefined", "anonymous", "guest", "test",
]);

export function validateHandleFormat(handle: string): string | null {
  if (handle.length < 3) return "Must be at least 3 characters.";
  if (handle.length > 20) return "Must be 20 characters or fewer.";
  if (!/^[a-z][a-z0-9_]*$/.test(handle)) {
    if (/[A-Z]/.test(handle)) return "Lowercase only.";
    if (/^\d/.test(handle)) return "Can't start with a number.";
    if (/^_/.test(handle)) return "Can't start with an underscore.";
    return "Letters, numbers, and underscores only.";
  }
  if (RESERVED_HANDLES.has(handle)) return "That handle is reserved.";
  return null;
}

export async function submitHandle(
  formData: FormData
): Promise<{ error: string } | never> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

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

  redirect("/onboarding/interests");
}

// ─── Whiskey interest ─────────────────────────────────────────────────────

const VALID_INTERESTS: WhiskeyInterest[] = [
  "BOURBON", "SCOTCH", "RYE", "JAPANESE", "IRISH", "NOT_SURE",
];

export async function submitWhiskeyInterest(
  formData: FormData
): Promise<{ error: string } | never> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const raw = formData.get("interest") as string | null;

  if (raw && VALID_INTERESTS.includes(raw as WhiskeyInterest)) {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { whiskeyInterest: raw as WhiskeyInterest },
    });
  }
  // If skipped (null or invalid), just proceed without saving

  redirect("/welcome");
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
