import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { fetchProfileData } from "@/lib/profile-data";
import AppBar from "@/components/app-bar";
import BottomNav from "@/components/bottom-nav";
import ProfileView from "@/components/profile-view";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const result = await fetchProfileData({ id: session.user.id }, session.user.id);
  if (!result) redirect("/login");

  return (
    <div className="flex flex-col min-h-screen bg-[#fffbfa]">
      <AppBar />
      <main className="flex-1 pb-20">
        <ProfileView
          user={result.user}
          isOwnProfile={true}
          isFollowing={false}
        />
      </main>
      <BottomNav />
    </div>
  );
}
