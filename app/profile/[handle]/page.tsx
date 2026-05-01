import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
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

  const [user, postLikeCounts, postCommentCounts] = await Promise.all([
    prisma.user.findUnique({
      where: { handle },
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

  if (!user) notFound();

  const likeMap = Object.fromEntries(postLikeCounts.map((l) => [l.targetId, l._count.userId]));
  const commentMap = Object.fromEntries(postCommentCounts.map((c) => [c.targetId, c._count.id]));

  const userWithCounts = {
    ...user,
    posts: user.posts.map((p) => ({
      ...p,
      likeCount: likeMap[p.id] ?? 0,
      commentCount: commentMap[p.id] ?? 0,
    })),
  };

  const isOwnProfile = session.user.id === user.id;

  return (
    <div className="flex flex-col min-h-screen bg-[#fffbfa]">
      <AppBar />
      <main className="flex-1 pb-20">
        <ProfileView user={userWithCounts} isOwnProfile={isOwnProfile} />
      </main>
      <BottomNav />
    </div>
  );
}
