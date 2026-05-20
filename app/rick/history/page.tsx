import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import AppBar from "@/components/app-bar";
import BottomNav from "@/components/bottom-nav";

export default async function RickHistoryPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  // Same dietary prefs gate as /rick
  const prefCheck = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { dietaryPreferencesSet: true },
  });
  if (!prefCheck?.dietaryPreferencesSet) {
    redirect("/preferences/dietary?redirectTo=/rick/history");
  }

  const conversations = await prisma.conversation.findMany({
    where: {
      userId: session.user.id,
      messages: { some: {} },
    },
    orderBy: { updatedAt: "desc" },
    skip: 1, // skip the most recent — that's the active conversation shown in /rick
    take: 20,
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
        select: { role: true, content: true, recipeJson: true },
      },
    },
  });

  const items = conversations.map((conv) => {
    const firstUser = conv.messages.find((m) => m.role === "USER");
    const raw = firstUser?.content ?? "";
    const preview = raw.length > 70 ? `${raw.slice(0, 70)}…` : raw;
    const hasRecipe = conv.messages.some((m) => m.recipeJson != null);

    const date = new Date(conv.updatedAt);
    const formatted = date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZone: "UTC",
    });

    return { id: conv.id, preview, hasRecipe, formatted };
  });

  return (
    <div className="flex flex-col min-h-screen bg-[#fffbfa]">
      <AppBar title="Conversations" showBack />

      <main className="flex-1 pb-nav">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center px-6">
            <p className="text-sm text-gray-500">No conversations yet.</p>
            <p className="text-xs text-gray-400 mt-1">
              Start chatting with Rick to see your history here.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {items.map((item) => (
              <li key={item.id}>
                <Link
                  href={`/rick/history/${item.id}`}
                  className="flex items-center gap-3 px-4 py-4 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <p className="text-xs text-gray-400">{item.formatted}</p>
                      {item.hasRecipe && (
                        <span className="text-[10px] text-[#551904] font-bold">✦</span>
                      )}
                    </div>
                    <p className="text-sm text-[#0d3c54] truncate">
                      {item.preview || <span className="text-gray-400 italic">No preview</span>}
                    </p>
                  </div>
                  <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
