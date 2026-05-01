import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import AppBar from "@/components/app-bar";
import BottomNav from "@/components/bottom-nav";
import ProfileView from "@/components/profile-view";

async function getProfileData(userId: string) {
  const [user, postLikeCounts, postCommentCounts] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      include: {
        reviews: {
          where: { status: "APPROVED" },
          orderBy: { createdAt: "desc" },
          include: {
            user: { select: { handle: true, displayName: true, avatarUrl: true } },
            whiskey: { select: { id: true, name: true, brand: true } },
          },
        },
        posts: {
          where: { status: "APPROVED" },
          orderBy: { createdAt: "desc" },
          include: {
            user: { select: { handle: true, displayName: true, avatarUrl: true } },
            taggedWhiskey: { select: { id: true, name: true, brand: true } },
          },
        },
        recipes: {
          where: { status: "APPROVED" },
          orderBy: { createdAt: "desc" },
        },
        _count: { select: { followers: true, following: true } },
      },
    }),
    prisma.like.groupBy({
      by: ["targetId"],
      where: { targetType: "POST" },
      _count: { userId: true },
    }),
    prisma.comment.groupBy({
      by: ["targetId"],
      where: { targetType: "POST" },
      _count: { id: true },
    }),
  ]);

  if (!user) return null;

  const likeMap = Object.fromEntries(postLikeCounts.map((l) => [l.targetId, l._count.userId]));
  const commentMap = Object.fromEntries(postCommentCounts.map((c) => [c.targetId, c._count.id]));

  return {
    ...user,
    posts: user.posts.map((p) => ({
      ...p,
      likeCount: likeMap[p.id] ?? 0,
      commentCount: commentMap[p.id] ?? 0,
    })),
  };
}

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = await getProfileData(session.user.id);
  if (!user) redirect("/login");

  return (
    <div className="flex flex-col min-h-screen bg-[#fffbfa]">
      <AppBar />
      <main className="flex-1 pb-20">
        <ProfileView user={user} isOwnProfile={true} />
      </main>
      <BottomNav />
    </div>
  );
}
