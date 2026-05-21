"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus } from "lucide-react";
import LoadingDots from "@/components/loading-dots";
import WhiskeyPicker from "@/components/whiskey-picker";
import { updatePost } from "@/lib/actions/post";

interface WhiskeyResult {
  id: string;
  name: string;
  brand: string;
}

interface PostProps {
  id: string;
  body: string;
  mediaUrl: string | null;
  taggedWhiskeyId: string | null;
  taggedWhiskey: { id: string; name: string; brand: string } | null;
}

export default function EditPostClient({
  post,
  returnHref,
}: {
  post: PostProps;
  returnHref: string;
}) {
  const router = useRouter();
  const [body, setBody] = useState(post.body);
  const [taggedWhiskey, setTaggedWhiskey] = useState<WhiskeyResult | null>(post.taggedWhiskey);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [deleteExistingMedia, setDeleteExistingMedia] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const showExistingImage = !!post.mediaUrl && !deleteExistingMedia && !mediaFile;
  const showNewFile = mediaFile !== null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const fd = new FormData();
    fd.append("body", body.trim());
    if (taggedWhiskey) fd.append("taggedWhiskeyId", taggedWhiskey.id);
    if (mediaFile) fd.append("media", mediaFile);
    if (deleteExistingMedia) fd.append("deleteMedia", "true");

    setSubmitting(true);
    let result: Awaited<ReturnType<typeof updatePost>>;
    try {
      result = await updatePost(post.id, fd);
    } catch {
      setError("Upload failed. Check your connection or try a smaller image.");
      setSubmitting(false);
      return;
    }
    setSubmitting(false);

    if ("error" in result) {
      setError(result.error);
    } else {
      router.push(returnHref);
    }
  }

  return (
    <main className="flex-1 px-5 py-5 flex flex-col gap-5 max-w-lg mx-auto w-full pb-10">
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
            rows={4}
            placeholder="Pour one and tell us about it."
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-base text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0d3c54] transition resize-none"
          />
        </div>

        {/* Featured whiskey */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-bold text-[#0d3c54]">
            Featured whiskey <span className="font-normal text-gray-400">(optional)</span>
          </label>
          <WhiskeyPicker value={taggedWhiskey} onChange={setTaggedWhiskey} placeholder="Search for the bottle..." />
        </div>

        {/* Photo */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-bold text-[#0d3c54]">
            Photo <span className="font-normal text-gray-400">(optional)</span>
          </label>

          {showExistingImage && (
            <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3">
              <p className="text-sm text-gray-600 flex-1">Current photo saved</p>
              <button type="button" onClick={() => fileRef.current?.click()} className="text-xs font-bold text-[#0d3c54] hover:underline">Replace</button>
              <button type="button" onClick={() => setDeleteExistingMedia(true)} className="text-xs font-bold text-[#551904] hover:underline">Delete</button>
            </div>
          )}

          {deleteExistingMedia && !mediaFile && (
            <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-sm text-amber-700 flex-1">Photo will be removed on save</p>
              <button type="button" onClick={() => setDeleteExistingMedia(false)} className="text-xs font-bold text-amber-700 hover:underline">Undo</button>
            </div>
          )}

          {showNewFile && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-700 truncate flex-1">{mediaFile.name}</span>
              <button type="button" onClick={() => { setMediaFile(null); if (fileRef.current) fileRef.current.value = ""; }} className="text-xs text-[#551904] font-bold">Remove</button>
            </div>
          )}

          {!showExistingImage && !showNewFile && !deleteExistingMedia && (
            <button type="button" onClick={() => fileRef.current?.click()} className="flex items-center gap-2 rounded-xl border-2 border-[#0d3c54] px-4 py-2.5 text-sm font-bold text-[#0d3c54] hover:bg-[#0d3c54]/5 transition-colors w-fit">
              <ImagePlus size={16} />
              Upload a photo
            </button>
          )}

          <input ref={fileRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => { setMediaFile(e.target.files?.[0] ?? null); setDeleteExistingMedia(false); }}
          />
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-full bg-[#0d3c54] py-3.5 text-sm font-bold text-white hover:bg-[#0a2f42] transition-colors disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0d3c54] focus-visible:ring-offset-2"
        >
          {submitting
            ? <span className="flex items-center justify-center gap-2">Saving <LoadingDots /></span>
            : "Save changes"}
        </button>
      </form>
    </main>
  );
}
