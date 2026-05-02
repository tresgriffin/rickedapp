"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ImagePlus } from "lucide-react";
import Link from "next/link";
import AppBar from "@/components/app-bar";
import LoadingDots from "@/components/loading-dots";
import WhiskeyPicker from "@/components/whiskey-picker";
import SuccessOverlay from "@/components/success-overlay";
import { createPost } from "@/lib/actions/post";

interface WhiskeyResult {
  id: string;
  name: string;
  brand: string;
}

export default function NewPostPage() {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [taggedWhiskey, setTaggedWhiskey] = useState<WhiskeyResult | null>(null);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!body.trim()) { setError("Write something first."); return; }

    setSubmitting(true);
    const fd = new FormData();
    fd.append("body", body.trim());
    if (taggedWhiskey) fd.append("taggedWhiskeyId", taggedWhiskey.id);
    if (mediaFile) fd.append("media", mediaFile);

    const result = await createPost(fd);
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
        <SuccessOverlay variant="post" onClose={() => router.replace("/home")} />
      )}

      <main className="flex-1 px-5 py-5 flex flex-col gap-5 max-w-lg mx-auto w-full">
        <Link href="/home" className="flex items-center gap-1 text-sm text-[#551904] font-bold w-fit">
          <ChevronLeft size={16} />
          Back
        </Link>

        <h1 className="font-[family-name:var(--font-abhaya-libre)] text-2xl font-bold text-[#0d3c54]">
          Add Post
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Body */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="body" className="text-sm font-bold text-[#0d3c54]">
              What&apos;s in your glass?
            </label>
            <textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={5}
              placeholder="What are you pouring? Tell us what's in your glass."
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-black placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-[#0d3c54] transition"
            />
          </div>

          {/* Tag a whiskey */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-[#0d3c54]">
              Tag a whiskey <span className="font-normal text-gray-400">(optional)</span>
            </label>
            <WhiskeyPicker
              value={taggedWhiskey}
              onChange={setTaggedWhiskey}
              placeholder="Search for the bottle you're drinking..."
            />
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
                  onClick={() => { setMediaFile(null); if (fileRef.current) fileRef.current.value = ""; }}
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
                Posting <LoadingDots />
              </span>
            ) : "Post it"}
          </button>
        </form>
      </main>
    </div>
  );
}
