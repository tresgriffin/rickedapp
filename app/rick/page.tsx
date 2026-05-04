import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import BottomNav from "@/components/bottom-nav";
import RickChat from "@/components/rick-chat";

// TODO before launch: flip back to 5 for free tier (locked Phase 7 decision); set to 20 for testing only
const DAILY_LIMIT = 20;

async function getRickData(userId: string) {
  const [user, conversation] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        dietaryPreferencesSet: true,
        rickConversationsToday: true,
        rickLastResetAt: true,
      },
    }),
    prisma.conversation.findFirst({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    }),
  ]);

  if (!user) return null;

  const now = new Date();
  const resetDate = user.rickLastResetAt;
  const isNewDay =
    !resetDate ||
    resetDate.getUTCFullYear() !== now.getUTCFullYear() ||
    resetDate.getUTCMonth() !== now.getUTCMonth() ||
    resetDate.getUTCDate() !== now.getUTCDate();

  const conversationsToday = isNewDay ? 0 : user.rickConversationsToday;
  const remaining = Math.max(0, DAILY_LIMIT - conversationsToday);

  return {
    userId: user.id,
    remaining,
    conversation: conversation
      ? {
          id: conversation.id,
          messages: conversation.messages.map((m) => ({
            id: m.id,
            role: m.role as "USER" | "ASSISTANT",
            content: m.content,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            recipeJson: m.recipeJson as any,
          })),
        }
      : null,
  };
}

export default async function RickPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  // Hard redirect on first Rick visit if dietary prefs have never been set.
  // User can skip on the prefs page and land back here with dietaryPreferencesSet = true.
  const prefCheck = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { dietaryPreferencesSet: true },
  });
  if (!prefCheck?.dietaryPreferencesSet) {
    redirect("/preferences/dietary?redirectTo=/rick");
  }

  const data = await getRickData(session.user.id);
  if (!data) redirect("/login");

  return (
    <div className="flex flex-col h-screen bg-[#fffbfa] overflow-hidden">
      <div className="flex flex-col flex-1 min-h-0 pb-16">
        <Suspense>
          <RickChat
            userId={data.userId}
            initialConversationId={data.conversation?.id ?? null}
            initialMessages={data.conversation?.messages ?? []}
            initialRemaining={data.remaining}
          />
        </Suspense>
      </div>

      <BottomNav />
    </div>
  );
}
