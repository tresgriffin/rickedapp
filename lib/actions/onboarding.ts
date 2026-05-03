"use server";

import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

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
