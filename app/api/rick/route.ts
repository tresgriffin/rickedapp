import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import Anthropic from "@anthropic-ai/sdk";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { buildSystemPrompt, RICK_SYSTEM_PROMPT } from "@/lib/rick-prompt";
import type { MessageRole } from "@/app/generated/prisma/client";

// TODO before launch: flip back to 5 for free tier (locked Phase 7 decision); set to 20 for testing only
const DAILY_LIMIT = 20;
// Sonnet 4.6 is the default: capable of JSON schema compliance and cocktail recipe quality
// at meaningfully lower cost than Opus. Tiered routing (Haiku for Q&A, Sonnet for recipes)
// was rejected — you can't predict recipe-vs-conversation turns client-side without a second
// API call. Override with RICK_MODEL env var if quality issues are observed. Revisit at scale (Phase 8+).
const MODEL = process.env.RICK_MODEL ?? "claude-sonnet-4-6";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// POST /api/rick
// Body: { message: string, conversationId?: string }
// Returns: { message: string, recipe: object | null, conversationId: string }
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      name: true,
      displayName: true,
      rickConversationsToday: true,
      rickLastResetAt: true,
      dietaryPreferencesSet: true,
      dietaryRestrictions: true,
      dietaryNotes: true,
      _count: { select: { recipes: true } },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Reset daily counter if it's a new UTC day
  const now = new Date();
  const resetDate = user.rickLastResetAt;
  const isNewDay =
    !resetDate ||
    resetDate.getUTCFullYear() !== now.getUTCFullYear() ||
    resetDate.getUTCMonth() !== now.getUTCMonth() ||
    resetDate.getUTCDate() !== now.getUTCDate();

  let conversationsToday = user.rickConversationsToday;
  if (isNewDay) {
    conversationsToday = 0;
  }

  if (conversationsToday >= DAILY_LIMIT) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const body = await request.json();
  const userMessage: string = body.message?.trim();
  const conversationId: string | undefined = body.conversationId;

  if (!userMessage) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  // Load or create conversation
  let conversation = conversationId
    ? await prisma.conversation.findFirst({
        where: { id: conversationId, userId: user.id },
        include: { messages: { orderBy: { createdAt: "asc" } } },
      })
    : null;

  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: { userId: user.id },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });
  }

  // Build Anthropic messages from history + new user message
  const historyMessages: Anthropic.MessageParam[] = conversation.messages.map(
    (m, i) => {
      const isLast = i === conversation!.messages.length - 1;
      const content: Anthropic.ContentBlockParam[] = [
        { type: "text", text: m.content },
      ];
      // Cache the last history message to benefit from multi-turn prompt caching
      if (isLast && m.role === "USER") {
        (content[0] as Anthropic.TextBlockParam & { cache_control?: { type: "ephemeral" } }).cache_control =
          { type: "ephemeral" };
      }
      return {
        role: m.role === "USER" ? "user" : "assistant",
        content,
      };
    }
  );

  const allMessages: Anthropic.MessageParam[] = [
    ...historyMessages,
    { role: "user", content: userMessage },
  ];

  // Build system prompt with two blocks: static (cached) + dynamic user profile
  const userProfile = {
    name: user.displayName ?? user.name,
    savedRecipes: 0, // FUTURE: track saved/bookmarked recipes
    createdRecipes: user._count.recipes,
    dietaryPreferencesSet: user.dietaryPreferencesSet,
    dietaryRestrictions: user.dietaryRestrictions,
    dietaryNotes: user.dietaryNotes,
  };

  // Dynamic profile block (not cached — changes per user)
  const fullPrompt = buildSystemPrompt(userProfile);
  const profileEndMarker = "[/USER_PROFILE]\n\n";
  const profileEnd = fullPrompt.indexOf(profileEndMarker) + profileEndMarker.length;
  const profileBlock = fullPrompt.slice(0, profileEnd);

  const systemBlocks: Anthropic.TextBlockParam[] = [
    {
      type: "text",
      text: profileBlock,
    },
    {
      type: "text",
      text: RICK_SYSTEM_PROMPT,
      cache_control: { type: "ephemeral" },
    },
  ];

  // Call Anthropic API
  let rickResponseText: string;
  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 2048,
      system: systemBlocks,
      messages: allMessages,
    });

    const textBlock = response.content.find((b) => b.type === "text");
    rickResponseText = textBlock?.type === "text" ? textBlock.text : "";
  } catch (err) {
    console.error("Anthropic API error:", err);
    return NextResponse.json({ error: "ai_error" }, { status: 502 });
  }

  // Parse Rick's JSON response
  let parsed: { message: string; recipe: object | null };
  try {
    parsed = JSON.parse(rickResponseText);
  } catch {
    // Fallback: treat entire response as a message with no recipe
    parsed = { message: rickResponseText, recipe: null };
  }

  // Save user message + Rick's response to DB, update rate limit counter
  await prisma.$transaction([
    prisma.conversationMessage.create({
      data: {
        conversationId: conversation.id,
        role: "USER" as MessageRole,
        content: userMessage,
      },
    }),
    prisma.conversationMessage.create({
      data: {
        conversationId: conversation.id,
        role: "ASSISTANT" as MessageRole,
        content: parsed.message,
        recipeJson: parsed.recipe ?? undefined,
      },
    }),
    prisma.conversation.update({
      where: { id: conversation.id },
      data: { updatedAt: now },
    }),
    prisma.user.update({
      where: { id: user.id },
      data: {
        rickConversationsToday: conversationsToday + 1,
        ...(isNewDay ? { rickLastResetAt: now } : {}),
      },
    }),
  ]);

  return NextResponse.json({
    message: parsed.message,
    recipe: parsed.recipe ?? null,
    conversationId: conversation.id,
  });
}

// GET /api/rick?conversationId=... — load conversation history
// GET /api/rick — load most recent conversation
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, rickConversationsToday: true, rickLastResetAt: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Compute remaining daily messages
  const now = new Date();
  const resetDate = user.rickLastResetAt;
  const isNewDay =
    !resetDate ||
    resetDate.getUTCFullYear() !== now.getUTCFullYear() ||
    resetDate.getUTCMonth() !== now.getUTCMonth() ||
    resetDate.getUTCDate() !== now.getUTCDate();
  const conversationsToday = isNewDay ? 0 : user.rickConversationsToday;
  const remaining = Math.max(0, DAILY_LIMIT - conversationsToday);

  const { searchParams } = new URL(request.url);
  const conversationId = searchParams.get("conversationId");

  const where = conversationId
    ? { id: conversationId, userId: user.id }
    : { userId: user.id };

  const conversation = await prisma.conversation.findFirst({
    where,
    orderBy: { updatedAt: "desc" },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });

  return NextResponse.json({
    conversation: conversation
      ? {
          id: conversation.id,
          messages: conversation.messages.map((m) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            recipeJson: m.recipeJson,
            createdAt: m.createdAt,
          })),
        }
      : null,
    remaining,
  });
}
