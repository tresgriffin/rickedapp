"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function markRickOnboardingSeen(): Promise<void> {
  const session = await getServerSession(authOptions);
  if (!session) return;

  await prisma.user.update({
    where: { id: session.user.id },
    data: { hasSeenRickOnboarding: true },
  });
}
