import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import Anthropic from "@anthropic-ai/sdk";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { buildSystemPrompt, RICK_SYSTEM_PROMPT } from "@/lib/rick-prompt";
import type { MessageRole } from "@/app/generated/prisma/client";

const DAILY_LIMIT = 5; // free tier — locked Phase 7 spec; was 20 during dev testing
// Sonnet 4.6 is the default: capable of JSON schema compliance and cocktail recipe quality
// at meaningfully lower cost than Opus. Tiered routing (Haiku for Q&A, Sonnet for recipes)
// was rejected — you can't predict recipe-vs-conversation turns client-side without a second
// API call. Override with RICK_MODEL env var if quality issues are observed. Revisit at scale (Phase 8+).
const MODEL = process.env.RICK_MODEL ?? "claude-sonnet-4-6";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/**
 * Three-tier parse fallback for Rick's JSON responses.
 *
 * Tier 1 (caller): clean JSON.parse() — normal path.
 * Tier 2 (this function): the response contains one or more valid {message, recipe}
 *   blocks embedded in non-JSON text (e.g. multiple concatenated objects from a
 *   multi-recipe request). Scans for all {"message": occurrences, extracts each
 *   block by brace-counting while respecting string contents, and returns the last
 *   block that parses cleanly — preferring blocks that carry a non-null recipe.
 * Tier 3 (caller): nothing extractable → self-deprecating error the user can retry.
 */
function extractLastValidBlock(
  raw: string
): { message: string; recipe: object | null } | null {
  const candidates: Array<{ message: string; recipe: object | null }> = [];

  // Match every { that is immediately followed (after optional whitespace) by "message":
  const blockStart = /\{(?=\s*"message"\s*:)/g;
  let match: RegExpExecArray | null;

  while ((match = blockStart.exec(raw)) !== null) {
    const start = match.index;
    let depth = 0;
    let inString = false;
    let escape = false;

    for (let i = start; i < raw.length; i++) {
      const ch = raw[i];
      if (escape) { escape = false; continue; }
      if (ch === "\\" && inString) { escape = true; continue; }
      if (ch === '"') { inString = !inString; continue; }
      if (inString) continue;
      if (ch === "{") { depth++; }
      else if (ch === "}") {
        depth--;
        if (depth === 0) {
          try {
            const obj = JSON.parse(raw.slice(start, i + 1));
            if (obj && typeof obj.message === "string") {
              candidates.push({ message: obj.message, recipe: obj.recipe ?? null });
            }
          } catch { /* not a clean JSON object, skip */ }
          break;
        }
      }
    }
  }

  if (candidates.length === 0) return null;

  // Prefer the last candidate that carries a non-null recipe (most informative);
  // fall back to the last candidate overall.
  const withRecipe = candidates.filter((c) => c.recipe !== null);
  return withRecipe.length > 0
    ? withRecipe[withRecipe.length - 1]
    : candidates[candidates.length - 1];
}

// Normalize a string for fuzzy title matching: lowercase, strip punctuation, collapse spaces
function normalizeForMatch(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();
}

// Returns the first canonical catalog recipe whose title appears in the user's message
// or in the last 4 turns of conversation history. Longest title wins on ties.
function findCatalogMatch(
  userMessage: string,
  history: { role: string; content: string }[],
  catalog: { id: string; title: string }[]
): { title: string } | null {
  const recentHistory = history.slice(-4).map((m) => m.content).join(" ");
  const corpus = normalizeForMatch(`${userMessage} ${recentHistory}`);
  const sorted = [...catalog].sort((a, b) => b.title.length - a.title.length);
  for (const recipe of sorted) {
    if (corpus.includes(normalizeForMatch(recipe.title))) {
      return { title: recipe.title };
    }
  }
  return null;
}

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
      whiskeyInterest: true,
      isAdmin: true,
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

  if (!user.isAdmin && conversationsToday >= DAILY_LIMIT) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const body = await request.json();
  const userMessage: string = body.message?.trim();
  const conversationId: string | undefined = body.conversationId;

  if (!userMessage) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  // Load catalog + conversation in parallel — catalog fetch adds no latency
  const [catalog, existingConversation] = await Promise.all([
    prisma.recipe.findMany({
      where: { user: { handle: "rick" }, isPublished: true, status: "APPROVED" },
      select: { id: true, title: true },
    }),
    conversationId
      ? prisma.conversation.findFirst({
          where: { id: conversationId, userId: user.id },
          include: { messages: { orderBy: { createdAt: "asc" } } },
        })
      : Promise.resolve(null),
  ]);

  let conversation = existingConversation;
  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: { userId: user.id },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });
  }

  // Fuzzy-match user message + recent history against the canonical catalog
  const catalogMatch = findCatalogMatch(userMessage, conversation.messages, catalog);

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
    whiskeyInterest: user.whiskeyInterest,
  };

  // Dynamic profile block (not cached — changes per user)
  const fullPrompt = buildSystemPrompt(userProfile);
  const profileEndMarker = "[/USER_PROFILE]\n\n";
  const profileEnd = fullPrompt.indexOf(profileEndMarker) + profileEndMarker.length;
  const profileBlock = fullPrompt.slice(0, profileEnd);

  const systemBlocks: Anthropic.TextBlockParam[] = [
    { type: "text", text: profileBlock },
    // Catalog match block — dynamic per turn, not cached
    ...(catalogMatch
      ? [{ type: "text" as const, text: `[CATALOG_MATCH]\nTitle: "${catalogMatch.title}"\n[/CATALOG_MATCH]` }]
      : []),
    { type: "text", text: RICK_SYSTEM_PROMPT, cache_control: { type: "ephemeral" } },
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

  // Parse Rick's JSON response — three-tier fallback:
  // Tier 1: clean parse → normal render
  // Tier 2: malformed output (e.g. multiple concatenated objects) → extract the last
  //         valid {message, recipe} block so good content isn't lost
  // Tier 3: nothing recoverable → self-deprecating error the user can retry
  let parsed: { message: string; recipe: object | null };
  try {
    parsed = JSON.parse(rickResponseText);
  } catch {
    const recovered = extractLastValidBlock(rickResponseText);
    parsed = recovered ?? {
      message: "I got a bit tangled up there — mind trying that again?",
      recipe: null,
    };
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
    // Admins bypass rate-limit tracking — don't increment their counter
    ...(user.isAdmin ? [] : [
      prisma.user.update({
        where: { id: user.id },
        data: {
          rickConversationsToday: conversationsToday + 1,
          ...(isNewDay ? { rickLastResetAt: now } : {}),
        },
      }),
    ]),
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
    select: { id: true, rickConversationsToday: true, rickLastResetAt: true, isAdmin: true },
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
  const remaining = user.isAdmin ? 999 : Math.max(0, DAILY_LIMIT - conversationsToday);

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
