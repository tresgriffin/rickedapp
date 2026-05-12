"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ImagePlus, Plus, X } from "lucide-react";
import Link from "next/link";
import AppBar from "@/components/app-bar";
import LoadingDots from "@/components/loading-dots";
import SuccessOverlay from "@/components/success-overlay";
import WhiskeyPicker from "@/components/whiskey-picker";
import { createRecipe } from "@/lib/actions/recipe";

interface Ingredient {
  amount: string;
  item: string;
}

interface WhiskeyResult {
  id: string;
  name: string;
  brand: string;
}

export default function NewRecipePage() {
  return (
    <Suspense>
      <NewRecipeForm />
    </Suspense>
  );
}

function NewRecipeForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefilledWhiskeyId = searchParams.get("whiskeyId");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [taggedWhiskey, setTaggedWhiskey] = useState<WhiskeyResult | null>(null);
  const [ingredients, setIngredients] = useState<Ingredient[]>([{ amount: "", item: "" }]);
  const [steps, setSteps] = useState<string[]>(["", ""]);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Pre-populate whiskey picker when launched from a brand page
  useEffect(() => {
    if (!prefilledWhiskeyId) return;
    fetch(`/api/whiskeys/${prefilledWhiskeyId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.id) setTaggedWhiskey({ id: d.id, name: d.name, brand: d.brand });
      })
      .catch(() => {});
  }, [prefilledWhiskeyId]);

  function updateIngredient(i: number, field: keyof Ingredient, value: string) {
    setIngredients((prev) =>
      prev.map((ing, idx) => (idx === i ? { ...ing, [field]: value } : ing))
    );
  }

  function removeIngredient(i: number) {
    setIngredients((prev) => prev.filter((_, idx) => idx !== i));
  }

  function updateStep(i: number, value: string) {
    setSteps((prev) => prev.map((s, idx) => (idx === i ? value : s)));
  }

  function removeStep(i: number) {
    setSteps((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const fd = new FormData();
    fd.append("title", title.trim());
    fd.append("description", description.trim());
    fd.append("ingredients", JSON.stringify(ingredients));
    fd.append("steps", JSON.stringify(steps));
    if (taggedWhiskey) fd.append("taggedWhiskeyId", taggedWhiskey.id);
    if (mediaFile) fd.append("media", mediaFile);

    setSubmitting(true);
    let result: Awaited<ReturnType<typeof createRecipe>>;
    try {
      result = await createRecipe(fd);
    } catch {
      setError("Upload failed. Check your connection or try a smaller image.");
      setSubmitting(false);
      return;
    }
    setSubmitting(false);

    if ("error" in result) {
      setError(result.error);
    } else {
      setSuccess(true);
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#fffbfa]">
      <AppBar plain />

      {success && (
        <SuccessOverlay variant="recipe" onClose={() => router.replace("/profile")} />
      )}

      <main className="flex-1 px-5 py-5 flex flex-col gap-5 max-w-lg mx-auto w-full pb-10">
        <Link href="/home" className="flex items-center gap-1 text-sm text-[#551904] font-bold w-fit">
          <ChevronLeft size={16} />
          Back
        </Link>

        <h1 className="font-[family-name:var(--font-abhaya-libre)] text-2xl font-bold text-[#0d3c54]">
          Add Recipe
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="title" className="text-sm font-bold text-[#0d3c54]">
              Recipe name
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Old Fashioned, Whiskey Sour..."
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-base text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0d3c54] transition"
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="description" className="text-sm font-bold text-[#0d3c54]">
              Short description <span className="font-normal text-gray-400">(optional)</span>
            </label>
            <input
              id="description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="One line about this recipe."
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-base text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0d3c54] transition"
            />
          </div>

          {/* Featured whiskey */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-[#0d3c54]">
              Featured whiskey <span className="font-normal text-gray-400">(optional)</span>
            </label>
            <WhiskeyPicker
              value={taggedWhiskey}
              onChange={setTaggedWhiskey}
              placeholder="Search for the main spirit..."
            />
          </div>

          {/* Ingredients */}
          <div className="flex flex-col gap-2">
            <p className="text-sm font-bold text-[#0d3c54]">Ingredients</p>
            {ingredients.map((ing, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="text"
                  value={ing.amount}
                  onChange={(e) => updateIngredient(i, "amount", e.target.value)}
                  placeholder="2 oz"
                  className="w-20 flex-shrink-0 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-base text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0d3c54] transition"
                />
                <input
                  type="text"
                  value={ing.item}
                  onChange={(e) => updateIngredient(i, "item", e.target.value)}
                  placeholder="Bourbon"
                  className="flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-base text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0d3c54] transition"
                />
                {ingredients.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeIngredient(i)}
                    aria-label="Remove ingredient"
                    className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => setIngredients((prev) => [...prev, { amount: "", item: "" }])}
              className="flex items-center gap-1.5 text-sm font-bold text-[#551904] w-fit"
            >
              <Plus size={14} />
              Add ingredient
            </button>
          </div>

          {/* Steps */}
          <div className="flex flex-col gap-2">
            <p className="text-sm font-bold text-[#0d3c54]">Steps</p>
            {steps.map((step, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="mt-3 text-xs font-bold text-gray-400 w-5 flex-shrink-0 text-right">
                  {i + 1}.
                </span>
                <textarea
                  value={step}
                  onChange={(e) => updateStep(i, e.target.value)}
                  rows={2}
                  placeholder={`Step ${i + 1}`}
                  className="flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-base text-black placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-[#0d3c54] transition"
                />
                {steps.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeStep(i)}
                    aria-label="Remove step"
                    className="mt-3 text-gray-400 hover:text-gray-600 flex-shrink-0"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => setSteps((prev) => [...prev, ""])}
              className="flex items-center gap-1.5 text-sm font-bold text-[#551904] w-fit"
            >
              <Plus size={14} />
              Add step
            </button>
          </div>

          {/* Photo */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-[#0d3c54]">
              Photo <span className="font-normal text-gray-400">(optional)</span>
            </label>
            {mediaFile ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-700 truncate flex-1">{mediaFile.name}</span>
                <button
                  type="button"
                  onClick={() => {
                    setMediaFile(null);
                    if (fileRef.current) fileRef.current.value = "";
                  }}
                  className="text-xs text-[#551904] font-bold"
                >
                  Remove
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex items-center gap-2 rounded-xl border-2 border-[#0d3c54] px-4 py-2.5 text-sm font-bold text-[#0d3c54] hover:bg-[#0d3c54]/5 transition-colors w-fit"
              >
                <ImagePlus size={16} />
                Upload a photo
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setMediaFile(e.target.files?.[0] ?? null)}
            />
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-[#0d3c54] py-3.5 text-sm font-bold text-white hover:bg-[#0a2f42] transition-colors disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0d3c54] focus-visible:ring-offset-2"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                Sharing <LoadingDots />
              </span>
            ) : (
              "Share this recipe"
            )}
          </button>
        </form>
      </main>
    </div>
  );
}

