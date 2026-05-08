import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import CompleteProfileNudge from "@/components/complete-profile-nudge";

/**
 * Server component — renders the complete-profile nudge only when the user's
 * own profile is incomplete. "Complete" = avatar + bio + whiskeyInterest all set.
 * Only shown on the user's own profile page.
 */
export default async function CompleteProfileNudgeServer() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { avatarUrl: true, bio: true, whiskeyInterest: true },
  });

  if (!user) return null;

  const isComplete = !!user.avatarUrl && !!user.bio && !!user.whiskeyInterest;
  if (isComplete) return null;

  return <CompleteProfileNudge />;
}
