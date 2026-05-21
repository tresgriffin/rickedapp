"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function deleteRecipe(
  recipeId: string
): Promise<{ ok: true } | { error: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "Not signed in." };

  const recipe = await prisma.recipe.findUnique({
    where: { id: recipeId },
    select: { userId: true },
  });
  if (!recipe) return { error: "Recipe not found." };
  if (recipe.userId !== session.user.id) return { error: "Not your recipe." };

  await prisma.recipe.delete({ where: { id: recipeId } });
  return { ok: true };
}

export async function deletePost(
  postId: string
): Promise<{ ok: true } | { error: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "Not signed in." };

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { userId: true },
  });
  if (!post) return { error: "Post not found." };
  if (post.userId !== session.user.id) return { error: "Not your post." };

  await prisma.post.delete({ where: { id: postId } });
  return { ok: true };
}

export async function deleteConversation(
  conversationId: string
): Promise<{ ok: true } | { error: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "Not signed in." };

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { userId: true },
  });
  if (!conversation) return { error: "Conversation not found." };
  if (conversation.userId !== session.user.id) return { error: "Not your conversation." };

  await prisma.conversation.delete({ where: { id: conversationId } });
  return { ok: true };
}
