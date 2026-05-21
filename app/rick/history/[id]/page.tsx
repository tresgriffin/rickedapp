import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import AppBar from "@/components/app-bar";
import BottomNav from "@/components/bottom-nav";
import RickReadOnlyChat from "@/components/rick-read-only-chat";
import OwnerActionMenu from "@/components/owner-action-menu";

export default async function RickConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;

  const [conversation, savedRecipe] = await Promise.all([
    prisma.conversation.findFirst({
      where: { id, userId: session.user.id },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    }),
    prisma.recipe.findFirst({
      where: { sourceConversationId: id, userId: session.user.id },
      select: { id: true },
    }),
  ]);

  if (!conversation) notFound();

  const messages = conversation.messages.map((m) => ({
    id: m.id,
    role: m.role as "USER" | "ASSISTANT",
    content: m.content,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recipeJson: m.recipeJson as any,
  }));

  return (
    <div className="flex flex-col min-h-screen bg-[#fffbfa]">
      <AppBar title="Conversation" showBack />

      {/* Delete affordance — right-aligned below AppBar, mirrors item 12 pattern */}
      <div className="flex justify-end px-4 pt-3">
        <OwnerActionMenu
          type="conversation"
          id={id}
          afterDeleteHref="/rick/history"
        />
      </div>

      <main className="flex-1 pb-nav">
        <RickReadOnlyChat
          conversationId={id}
          messages={messages}
          savedRecipeId={savedRecipe?.id ?? null}
        />
      </main>

      <BottomNav />
    </div>
  );
}
