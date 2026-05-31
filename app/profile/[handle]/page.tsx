import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { fetchProfileData } from "@/lib/profile-data";
import AppBar from "@/components/app-bar";
import BottomNav from "@/components/bottom-nav";
import ProfileView from "@/components/profile-view";

export default async function UserProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ handle: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const { handle } = await params;
  const { tab } = await searchParams;

  const result = await fetchProfileData({ handle }, session.user.id);
  if (!result) notFound();

  const isOwnProfile = session.user.id === result.user.id;

  // Tapping the Profile nav icon should always go to /profile (own profile).
  // If someone navigates to /profile/[theirOwnHandle], redirect canonically.
  if (isOwnProfile) redirect("/profile");

  return (
    <div className="flex flex-col min-h-screen bg-[#fffbfa]">
      <AppBar />
      <main className="flex-1 pb-nav">
        <ProfileView
          user={result.user}
          isOwnProfile={isOwnProfile}
          isFollowing={result.isFollowing}
          hideReviewsTab={result.user.handle === "rick"}
          defaultTab={tab}
          viewerId={session.user.id}
        />
      </main>
      <BottomNav />
    </div>
  );
}
