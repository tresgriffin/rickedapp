import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { fetchProfileData } from "@/lib/profile-data";
import AppBar from "@/components/app-bar";
import BottomNav from "@/components/bottom-nav";
import ProfileView from "@/components/profile-view";
import VerificationBannerServer from "@/components/verification-banner-server";
import CompleteProfileNudgeServer from "@/components/complete-profile-nudge-server";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const result = await fetchProfileData({ id: session.user.id }, session.user.id, true);
  if (!result) redirect("/login");

  return (
    <div className="flex flex-col min-h-screen bg-[#fffbfa]">
      <AppBar />
      <VerificationBannerServer />
      <CompleteProfileNudgeServer />
      <main className="flex-1 pb-nav">
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
