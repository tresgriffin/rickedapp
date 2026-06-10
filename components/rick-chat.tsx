"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Send, Plus, ChevronRight, Clock } from "lucide-react";
import RocksGlass from "@/components/icons/rocks-glass";
import LoadingDots from "@/components/loading-dots";
import { saveRickRecipe } from "@/lib/actions/rick-recipe";

const SUGGESTION_CHIPS = [
  "I have bourbon",
  "Surprise me",
  "Something refreshing",
  "Make it boozy",
  "Low-ABV please",
];

interface RecipeIngredient {
  name: string;
  amount: string;
  unit: string | null;
  notes: string | null;
}

interface RecipeStep {
  order: number;
  instruction: string;
}

interface RickRecipe {
  title: string;
  description: string;
  difficulty: "EASY" | "MEDIUM" | "ADVANCED";
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
  rickNote: string | null;
  safetyFlags: string[];
}

interface ChatMessage {
  id?: string;
  role: "USER" | "ASSISTANT";
  content: string;
  recipeJson?: RickRecipe | null;
}

interface RickChatProps {
  userId: string;
  initialConversationId?: string | null;
  initialMessages?: ChatMessage[];
  initialRemaining?: number;
}

function RecipeCard({
  recipe,
  conversationId,
  onSaved,
}: {
  recipe: RickRecipe;
  conversationId: string;
  onSaved: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [isCanonical, setIsCanonical] = useState(false);
  const [saveError, setSaveError] = useState("");
  const saveInFlight = useRef(false);

  async function handleSave() {
    // Guard against double-tap triggering two concurrent saves
    if (saving || savedId || saveInFlight.current) return;
    saveInFlight.current = true;
    setSaving(true);
    setSaveError("");
    const result = await saveRickRecipe(conversationId, recipe);
    if ("id" in result) {
      setSavedId(result.id);
      setIsCanonical(result.isCanonical ?? false);
      onSaved();
    } else {
      setSaveError(result.error);
    }
    setSaving(false);
    saveInFlight.current = false;
  }

  const sortedIngredients = recipe.ingredients;
  const sortedSteps = recipe.steps.sort((a, b) => a.order - b.order);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mt-2">
      {/* Header */}
      <div className="bg-[#0d3c54] px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-bold text-white">{recipe.title}</p>
            {recipe.description && (
              <p className="text-xs text-white/60 mt-0.5 leading-relaxed">{recipe.description}</p>
            )}
          </div>
          <span className="flex-shrink-0 text-[10px] font-bold uppercase tracking-wide text-white/50 bg-white/10 rounded-full px-2 py-0.5 mt-0.5">
            {recipe.difficulty}
          </span>
        </div>
      </div>

      <div className="px-4 py-3 flex flex-col gap-3">
        {/* Safety flags */}
        {recipe.safetyFlags.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
            <p className="text-xs text-amber-700 font-medium">
              ⚠️ {recipe.safetyFlags.join(" · ")}
            </p>
          </div>
        )}

        {/* Ingredients */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#0d3c54] mb-1.5">
            Ingredients
          </p>
          <ul className="flex flex-col gap-1">
            {sortedIngredients.map((ing, i) => (
              <li key={i} className="text-xs text-gray-700 flex gap-2">
                <span className="font-medium text-[#551904] w-16 flex-shrink-0">
                  {ing.amount}{ing.unit ? ` ${ing.unit}` : ""}
                </span>
                <span>
                  {ing.name}
                  {ing.notes ? <span className="text-gray-400"> ({ing.notes})</span> : null}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Steps */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#0d3c54] mb-1.5">
            Steps
          </p>
          <ol className="flex flex-col gap-1.5">
            {sortedSteps.map((step) => (
              <li key={step.order} className="text-xs text-gray-700 flex gap-2">
                <span className="font-bold text-[#0d3c54] flex-shrink-0 w-4">{step.order}.</span>
                <span>{step.instruction}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Rick note */}
        {recipe.rickNote && (
          <p className="text-xs text-gray-500 italic border-t border-gray-100 pt-2">
            {recipe.rickNote}
          </p>
        )}

        {/* Save / view CTA */}
        <div className="border-t border-gray-100 pt-2 flex flex-col gap-1.5">
          {savedId ? (
            isCanonical ? (
              <Link
                href={`/recipe/${savedId}`}
                className="w-full flex items-center justify-center gap-2 rounded-full bg-[#551904] py-2.5 text-xs font-bold text-white hover:bg-[#551904]/90 transition-colors"
              >
                View recipe
                <ChevronRight size={14} />
              </Link>
            ) : (
              <Link
                href={`/recipe/${savedId}/publish`}
                className="w-full flex items-center justify-center gap-2 rounded-full bg-[#551904] py-2.5 text-xs font-bold text-white hover:bg-[#551904]/90 transition-colors"
              >
                Tell Rick how it went
                <ChevronRight size={14} />
              </Link>
            )
          ) : (
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !!savedId}
              className="w-full rounded-full bg-[#0d3c54] py-2.5 text-xs font-bold text-white hover:bg-[#0d3c54]/90 transition-colors disabled:opacity-50"
            >
              {saving ? <span className="flex items-center justify-center gap-2">Saving <LoadingDots /></span> : "Save recipe"}
            </button>
          )}
          {saveError && <p className="text-xs text-red-500 text-center">{saveError}</p>}
        </div>
      </div>
    </div>
  );
}

// Character-destination avatar — real image in the chat header, RocksGlass fallback on load error
function RickHeaderAvatar() {
  const [imgError, setImgError] = useState(false);
  if (imgError) {
    return (
      <div className="w-8 h-8 rounded-full bg-[#551904] flex items-center justify-center flex-shrink-0">
        <RocksGlass size={16} className="text-white" />
      </div>
    );
  }
  return (
    <Image
      src="/rick-avatar.png"
      alt="Rick"
      width={32}
      height={32}
      className="w-8 h-8 rounded-full object-cover object-center flex-shrink-0"
      onError={() => setImgError(true)}
    />
  );
}

// Per-message avatar — character image with RocksGlass fallback
function RickAvatar() {
  const [imgError, setImgError] = useState(false);
  if (imgError) {
    return (
      <div className="w-7 h-7 rounded-full bg-[#551904] flex items-center justify-center flex-shrink-0 mt-0.5">
        <RocksGlass size={13} className="text-white" />
      </div>
    );
  }
  return (
    <Image
      src="/rick-avatar.png"
      alt="Rick"
      width={28}
      height={28}
      className="w-7 h-7 rounded-full object-cover object-center flex-shrink-0 mt-0.5"
      onError={() => setImgError(true)}
    />
  );
}

export default function RickChat({
  initialConversationId,
  initialMessages = [],
  initialRemaining = 20,
}: RickChatProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  // ?prompt= → fills input AND auto-sends (custom typed message, deliberate intent)
  // ?prefill= → fills input only, no auto-send (chip tap, user may want to edit first)
  // Either param signals a home-feed handoff → start fresh so auto-send fires reliably
  // and the user isn't dropped mid-conversation.
  const promptParam = searchParams.get("prompt");
  const prefillParam = searchParams.get("prefill");
  const isHandoff = !!promptParam || !!prefillParam;

  const [messages, setMessages] = useState<ChatMessage[]>(isHandoff ? [] : initialMessages);
  const [conversationId, setConversationId] = useState<string | null>(
    isHandoff ? null : (initialConversationId ?? null)
  );
  const [input, setInput] = useState(promptParam ?? prefillParam ?? "");
  const [loading, setLoading] = useState(false);
  const [remaining, setRemaining] = useState(initialRemaining);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const conversationIdRef = useRef(conversationId);

  const isRateLimited = remaining <= 0;
  const isNewConversation = messages.length === 0;

  useEffect(() => {
    conversationIdRef.current = conversationId;
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading || isRateLimited) return;

    setMessages((prev) => [...prev, { role: "USER", content: trimmed }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/rick", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, conversationId: conversationIdRef.current }),
      });

      const data = await res.json();

      if (res.status === 429) {
        setRemaining(0);
        return;
      }

      if (!res.ok) {
        const msg = data?.error === "ai_error"
          ? "Rick had a moment — give it another go."
          : "Something hiccuped on my end. Give me a sec and try again.";
        setMessages((prev) => [...prev, { role: "ASSISTANT", content: msg }]);
        return;
      }

      if (data.conversationId && !conversationIdRef.current) {
        setConversationId(data.conversationId);
        conversationIdRef.current = data.conversationId;
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "ASSISTANT",
          content: data.message,
          recipeJson: data.recipe ?? null,
        },
      ]);
      setRemaining((r) => Math.max(0, r - 1));
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "ASSISTANT", content: "Couldn't reach Rick. Check your connection and try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  // Auto-send if prompt param is present and no prior messages
  const didAutoSend = useRef(false);
  useEffect(() => {
    const prompt = searchParams.get("prompt");
    if (prompt && messages.length === 0 && !didAutoSend.current) {
      didAutoSend.current = true;
      sendMessage(prompt);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  function startNewConversation() {
    setMessages([]);
    setConversationId(null);
    conversationIdRef.current = null;
    setInput("");
    router.replace("/rick");
  }

  return (
    <>
      {/* ── Rick header ─────────────────────────────────────────────── */}
      <header className="flex-shrink-0 sticky top-0 z-20 bg-[#0d3c54] px-4 pb-3 pt-appbar flex items-center gap-3 shadow-sm">
        <RickHeaderAvatar />
        <div className="flex-1">
          <p className="text-sm font-bold text-white leading-none">Rick</p>
          <p className="text-[10px] text-white/50 leading-none mt-0.5">Resident Mixologist</p>
        </div>
        {/* History — secondary affordance, lower visual weight than + New */}
        <Link
          href="/rick/history"
          className="flex items-center gap-1 text-xs text-white/40 hover:text-white/60 transition-colors"
          aria-label="Conversation history"
        >
          <Clock size={12} />
          History
        </Link>

        <button
          type="button"
          onClick={startNewConversation}
          className="flex items-center gap-1.5 rounded-full border border-white/20 px-3 py-1.5 text-xs font-bold text-white/70 hover:text-white hover:border-white/40 transition-colors"
          aria-label="New conversation"
        >
          <Plus size={12} />
          New
        </button>
      </header>

    <div className="flex flex-col flex-1 min-h-0">
      {/* ── Message thread ──────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-2 flex flex-col gap-4">

        {/* Rick's opener when no messages yet */}
        {isNewConversation && (
          <div className="flex gap-2.5">
            <RickAvatar />
            <div className="flex-1">
              <div className="bg-white rounded-2xl rounded-tl-sm border border-gray-100 shadow-sm px-4 py-3 max-w-sm">
                <p className="text-sm text-black leading-relaxed">
                  What are we working with?
                </p>
              </div>
              <p className="text-[10px] text-gray-400 mt-1 ml-0.5">Rick</p>
            </div>
          </div>
        )}

        {/* Conversation history */}
        {messages.map((msg, i) => {
          if (msg.role === "USER") {
            return (
              <div key={i} className="flex justify-end">
                <div className="bg-[#0d3c54] rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[80%]">
                  <p className="text-sm text-white leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            );
          }
          return (
            <div key={i} className="flex gap-2.5">
              <RickAvatar />
              <div className="flex-1 max-w-[85%]">
                <div className="bg-white rounded-2xl rounded-tl-sm border border-gray-100 shadow-sm px-4 py-3">
                  <p className="text-sm text-black leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                </div>
                {msg.recipeJson && (
                  <RecipeCard
                    recipe={msg.recipeJson}
                    conversationId={conversationId ?? ""}
                    onSaved={() =>
                      setMessages((prev) => [
                        ...prev,
                        {
                          role: "ASSISTANT",
                          content: "Saved. When you've made it, come back and let me know how it went.",
                        },
                      ])
                    }
                  />
                )}
                <p className="text-[10px] text-gray-400 mt-1 ml-0.5">Rick</p>
              </div>
            </div>
          );
        })}

        {/* Loading indicator */}
        {loading && (
          <div className="flex gap-2.5">
            <RickAvatar />
            <div className="bg-white rounded-2xl rounded-tl-sm border border-gray-100 shadow-sm px-4 py-3">
              <div className="flex gap-1 items-center h-4">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" />
              </div>
            </div>
          </div>
        )}

        {/* Rate limit wall */}
        {isRateLimited && (
          <div className="bg-[#551904]/6 border border-[#551904]/10 rounded-2xl px-4 py-4 text-center">
            <p className="text-sm font-bold text-[#551904] mb-1">That&apos;s the daily limit.</p>
            <p className="text-xs text-gray-500">Rick resets at midnight UTC. Check back tomorrow.</p>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Suggestion chips — shown only at start ───────────────── */}
      {isNewConversation && !loading && (
        <div className="px-4 pb-2">
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {SUGGESTION_CHIPS.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => sendMessage(chip)}
                disabled={isRateLimited}
                className="flex-shrink-0 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-[#0d3c54] hover:border-[#0d3c54]/40 transition-colors disabled:opacity-40"
              >
                {chip}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── New conversation button — shown mid-thread ───────────── */}
      {!isNewConversation && (
        <div className="px-4 pb-1 flex justify-end">
          <button
            type="button"
            onClick={startNewConversation}
            className="flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-[#0d3c54] transition-colors"
          >
            <Plus size={12} />
            New conversation
          </button>
        </div>
      )}

      {/* ── Input ───────────────────────────────────────────────── */}
      <div className="px-4 pb-4 pt-2 border-t border-gray-100 bg-[#fffbfa]">
        <div className="flex items-end gap-2 rounded-2xl border border-gray-200 bg-white px-3 py-2 focus-within:ring-2 focus-within:ring-[#0d3c54] focus-within:border-[#0d3c54] transition">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isRateLimited ? "Come back tomorrow…" : "Tell Rick what you've got…"}
            disabled={loading || isRateLimited}
            rows={1}
            className="flex-1 resize-none bg-transparent text-base text-black placeholder-gray-400 focus:outline-none leading-relaxed max-h-28 overflow-y-auto disabled:opacity-50"
            style={{ minHeight: "24px" }}
            onInput={(e) => {
              const el = e.currentTarget;
              el.style.height = "auto";
              el.style.height = `${Math.min(el.scrollHeight, 112)}px`;
            }}
          />
          <button
            type="button"
            onClick={() => sendMessage(input)}
            disabled={loading || isRateLimited || !input.trim()}
            className="w-8 h-8 rounded-full bg-[#0d3c54] flex items-center justify-center flex-shrink-0 hover:bg-[#0d3c54]/90 transition-colors disabled:opacity-30 mb-0.5"
            aria-label="Send"
          >
            <Send size={14} className="text-white" />
          </button>
        </div>
        {!isRateLimited && remaining <= 2 && (
          <p className="text-[10px] text-gray-400 mt-1 text-right">
            {remaining} message{remaining === 1 ? "" : "s"} left today
          </p>
        )}
      </div>
    </div>
    </>
  );
}
