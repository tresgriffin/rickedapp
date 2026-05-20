import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET /api/rick/conversations
// Returns up to 20 most recent Rick conversations for the authenticated user.
// Each row includes: id, timestamps, first-user-message preview, message count,
// and whether the conversation produced a saved recipe.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const conversations = await prisma.conversation.findMany({
    where: {
      userId: user.id,
      messages: { some: {} }, // exclude blank conversations (created but abandoned)
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

  const data = conversations.map((conv) => {
    const firstUser = conv.messages.find((m) => m.role === "USER");
    const raw = firstUser?.content ?? "";
    const preview = raw.length > 70 ? `${raw.slice(0, 70)}…` : raw;
    const hasRecipe = conv.messages.some((m) => m.recipeJson != null);

    return {
      id: conv.id,
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt,
      preview: preview || null,
      messageCount: conv.messages.length,
      hasRecipe,
    };
  });

  return NextResponse.json({ data });
}
