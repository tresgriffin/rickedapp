import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { fetchProfileData } from "@/lib/profile-data";
import AppBar from "@/components/app-bar";
import BottomNav from "@/components/bottom-nav";
import ProfileView from "@/components/profile-view";

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const { handle } = await params;

  const result = await fetchProfileData({ handle }, session.user.id);
  if (!result) notFound();

  const isOwnProfile = session.user.id === result.user.id;

  return (
    <div className="flex flex-col min-h-screen bg-[#fffbfa]">
      <AppBar />
      <main className="flex-1 pb-20">
        <ProfileView
          user={result.user}
          isOwnProfile={isOwnProfile}
          isFollowing={result.isFollowing}
        />
      </main>
      <BottomNav />
    </div>
  );
}
