import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import ProfileEditClient from "./client";

export default async function ProfileEditPage({
  searchParams,
}: {
  searchParams: Promise<{ email_change?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const [user, { email_change: emailChangeStatus }] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        displayName: true,
        name: true,
        bio: true,
        handle: true,
        avatarUrl: true,
        email: true,
        hashedPassword: true,
        pendingEmail: true,
        pendingEmailRequestedAt: true,
      },
    }),
    searchParams,
  ]);

  if (!user) redirect("/login");

  // Check if pending token is still valid (within 24 hours)
  const isPendingExpired =
    user.pendingEmail &&
    user.pendingEmailRequestedAt &&
    Date.now() - user.pendingEmailRequestedAt.getTime() > 1000 * 60 * 60 * 24;

  return (
    <ProfileEditClient
      displayName={user.displayName ?? user.name ?? ""}
      bio={user.bio ?? ""}
      handle={user.handle}
      avatarUrl={user.avatarUrl}
      currentEmail={user.email ?? ""}
      isOAuthOnly={!user.hashedPassword}
      pendingEmail={isPendingExpired ? null : (user.pendingEmail ?? null)}
      emailChangeStatus={emailChangeStatus ?? null}
    />
  );
}
