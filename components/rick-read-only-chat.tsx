"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import RocksGlass from "@/components/icons/rocks-glass";
import LoadingDots from "@/components/loading-dots";
import { saveRickRecipe } from "@/lib/actions/rick-recipe";

interface RickRecipeIngredient {
  name: string;
  amount: string;
  unit: string | null;
  notes: string | null;
}

interface RickRecipeStep {
  order: number;
  instruction: string;
}

interface RickRecipe {
  title: string;
  description: string;
  difficulty: "EASY" | "MEDIUM" | "ADVANCED";
  ingredients: RickRecipeIngredient[];
  steps: RickRecipeStep[];
  rickNote: string | null;
  safetyFlags: string[];
}

interface Message {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  recipeJson: RickRecipe | null;
}

interface RickReadOnlyChatProps {
  conversationId: string;
  messages: Message[];
  savedRecipeId: string | null;
}

function RickAvatar() {
  return (
    <div className="w-7 h-7 rounded-full bg-[#551904] flex items-center justify-center flex-shrink-0 mt-0.5">
      <RocksGlass size={13} className="text-white" />
    </div>
  );
}

function RecipeCard({
  recipe,
  conversationId,
  savedRecipeId,
  onSaved,
}: {
  recipe: RickRecipe;
  conversationId: string;
  savedRecipeId: string | null;
  onSaved: (id: string) => void;
}) {
  const [saving, setSaving] = useState(false);
  const saveInFlight = useRef(false);

  async function handleSave() {
    if (saving || savedRecipeId || saveInFlight.current) return;
    saveInFlight.current = true;
    setSaving(true);
    const result = await saveRickRecipe(conversationId, recipe);
    if ("id" in result) onSaved(result.id);
    setSaving(false);
    saveInFlight.current = false;
  }

  const sortedSteps = [...recipe.steps].sort((a, b) => a.order - b.order);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mt-2">
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
        {recipe.safetyFlags.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
            <p className="text-xs text-amber-700 font-medium">
              ⚠️ {recipe.safetyFlags.join(" · ")}
            </p>
          </div>
        )}

        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#0d3c54] mb-1.5">
            Ingredients
          </p>
          <ul className="flex flex-col gap-1">
            {recipe.ingredients.map((ing, i) => (
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

        {recipe.rickNote && (
          <p className="text-xs text-gray-500 italic border-t border-gray-100 pt-2">
            {recipe.rickNote}
          </p>
        )}

        <div className="border-t border-gray-100 pt-2">
          {savedRecipeId ? (
            <Link
              href={`/recipe/${savedRecipeId}`}
              className="w-full flex items-center justify-center gap-2 rounded-full bg-[#551904] py-2.5 text-xs font-bold text-white hover:bg-[#551904]/90 transition-colors"
            >
              View saved recipe
              <ChevronRight size={14} />
            </Link>
          ) : (
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="w-full rounded-full bg-[#0d3c54] py-2.5 text-xs font-bold text-white hover:bg-[#0d3c54]/90 transition-colors disabled:opacity-50"
            >
              {saving
                ? <span className="flex items-center justify-center gap-2">Saving <LoadingDots /></span>
                : "Save recipe"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function RickReadOnlyChat({
  conversationId,
  messages,
  savedRecipeId: initialSavedRecipeId,
}: RickReadOnlyChatProps) {
  const [savedRecipeId, setSavedRecipeId] = useState<string | null>(initialSavedRecipeId);

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center px-6">
        <p className="text-sm text-gray-500">No messages in this conversation.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 px-4 pt-4 pb-6">
      {messages.map((msg) => {
        if (msg.role === "USER") {
          return (
            <div key={msg.id} className="flex justify-end">
              <div className="bg-[#0d3c54] rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[80%]">
                <p className="text-sm text-white leading-relaxed whitespace-pre-wrap">
                  {msg.content}
                </p>
              </div>
            </div>
          );
        }

        return (
          <div key={msg.id} className="flex gap-2.5">
            <RickAvatar />
            <div className="flex-1 max-w-[85%]">
              <div className="bg-white rounded-2xl rounded-tl-sm border border-gray-100 shadow-sm px-4 py-3">
                <p className="text-sm text-black leading-relaxed whitespace-pre-wrap">
                  {msg.content}
                </p>
              </div>
              {msg.recipeJson && (
                <RecipeCard
                  recipe={msg.recipeJson}
                  conversationId={conversationId}
                  savedRecipeId={savedRecipeId}
                  onSaved={(id) => setSavedRecipeId(id)}
                />
              )}
              <p className="text-[10px] text-gray-400 mt-1 ml-0.5">Rick</p>
            </div>
          </div>
        );
      })}

      {/* Read-only indicator + CTA */}
      <div className="mt-2 flex flex-col items-center gap-3 border-t border-gray-100 pt-5">
        <p className="text-xs text-gray-400">This conversation is read-only.</p>
        <Link
          href="/rick"
          className="rounded-full bg-[#0d3c54] px-6 py-3 text-sm font-bold text-white hover:bg-[#0a2f42] transition-colors"
        >
          Back to chat
        </Link>
      </div>
    </div>
  );
}
