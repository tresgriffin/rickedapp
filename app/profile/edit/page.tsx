import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import ProfileEditClient from "./client";

export default async function ProfileEditPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { displayName: true, name: true, bio: true, handle: true, avatarUrl: true },
  });

  if (!user) redirect("/login");

  return (
    <ProfileEditClient
      displayName={user.displayName ?? user.name ?? ""}
      bio={user.bio ?? ""}
      handle={user.handle}
      avatarUrl={user.avatarUrl}
    />
  );
}
