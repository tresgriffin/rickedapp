import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * Returns the verified user ID, or an error string if not signed in / not verified.
 * Use in gated server actions (posting, reviewing, following, publishing recipes).
 * Rick chat is intentionally NOT gated — verification is required for social writes only.
 */
export async function requireVerifiedUser(): Promise<{ userId: string } | { error: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "You need to be signed in." };

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { emailVerified: true },
  });

  if (!user?.emailVerified) {
    return { error: "Please verify your email before posting, reviewing, or following. Check your inbox for a verification link." };
  }

  return { userId: session.user.id };
}
