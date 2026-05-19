import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import BottomNav from "@/components/bottom-nav";
import RickChat from "@/components/rick-chat";

const DAILY_LIMIT = 5; // free tier — must match constant in app/api/rick/route.ts

async function getRickData(userId: string) {
  const [user, conversation] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        dietaryPreferencesSet: true,
        rickConversationsToday: true,
        rickLastResetAt: true,
        isAdmin: true,
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
  const remaining = user.isAdmin ? 999 : Math.max(0, DAILY_LIMIT - conversationsToday);

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
    <div className="flex flex-col h-dvh bg-[#fffbfa] overflow-hidden">
      <div className="flex flex-col flex-1 min-h-0 pb-[calc(4rem+env(safe-area-inset-bottom))]">
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
