import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import EmailVerificationBanner from "@/components/email-verification-banner";

/**
 * Server component — checks emailVerified on the current user and renders
 * the client banner if unverified. Drop this just below <AppBar /> on any
 * authenticated page where write actions are available.
 */
export default async function VerificationBannerServer() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { emailVerified: true },
  });

  if (user?.emailVerified) return null;

  return <EmailVerificationBanner />;
}
