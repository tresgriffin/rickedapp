import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import AppBar from "@/components/app-bar";
import EditPostClient from "./client";

export default async function EditPostPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ return?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  const { return: returnHref } = await searchParams;

  const post = await prisma.post.findUnique({
    where: { id },
    select: {
      id: true,
      userId: true,
      body: true,
      mediaUrl: true,
      taggedWhiskeyId: true,
      taggedWhiskey: { select: { id: true, name: true, brand: true } },
    },
  });

  if (!post) notFound();
  if (post.userId !== session.user.id) notFound();

  return (
    <div className="flex flex-col min-h-screen bg-[#fffbfa]">
      <AppBar title="Edit post" showBack />
      <EditPostClient post={post} returnHref={returnHref ?? "/home"} />
    </div>
  );
}
