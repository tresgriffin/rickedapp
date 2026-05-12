"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { Camera } from "lucide-react";
import AppBar from "@/components/app-bar";
import BottomNav from "@/components/bottom-nav";
import Avatar from "@/components/avatar";
import LoadingDots from "@/components/loading-dots";
import { updateProfile } from "@/lib/actions/onboarding";
import { uploadAvatar } from "@/lib/actions/avatar";

interface Props {
  displayName: string;
  bio: string;
  handle: string | null;
  avatarUrl: string | null;
}

export default function ProfileEditClient({ displayName: initialName, bio: initialBio, handle, avatarUrl: initialAvatarUrl }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const avatarInputRef = useRef<HTMLInputElement>(null);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarError("");
    setAvatarUploading(true);

    try {
      const formData = new FormData();
      formData.set("avatar", file);
      const result = await uploadAvatar(formData);

      if ("error" in result) {
        setAvatarError(result.error);
      } else {
        setAvatarUrl(result.avatarUrl);
      }
    } catch {
      // Framework-level rejection (e.g. body too large before action runs)
      // or network error — surface a specific message rather than hanging
      setAvatarError("Upload failed. Check your connection or try a smaller image.");
    } finally {
      setAvatarUploading(false);
    }

    // Reset input so the same file can be re-selected after an error
    if (avatarInputRef.current) avatarInputRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await updateProfile(formData);
      if (result && "error" in result) setError(result.error);
    });
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#fffbfa]">
      <AppBar title="Edit profile" showBack />

      <main className="flex-1 pb-24 px-4 pt-6 max-w-lg mx-auto w-full">
        {/* Avatar upload */}
        <div className="flex flex-col items-center mb-8">
          <button
            type="button"
            onClick={() => avatarInputRef.current?.click()}
            disabled={avatarUploading || pending}
            className="relative group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0d3c54] rounded-full"
            aria-label="Upload profile photo"
          >
            <Avatar displayName={initialName} avatarUrl={avatarUrl} size="lg" />
            <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity">
              {avatarUploading
                ? <LoadingDots />
                : <Camera size={18} className="text-white" />}
            </div>
          </button>
          <p className="text-xs text-gray-400 mt-2">
            {avatarUploading ? "Uploading…" : "Tap to change photo"}
          </p>
          {avatarError && (
            <p className="text-xs text-red-600 mt-1 text-center">{avatarError}</p>
          )}
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic,image/gif"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>

        {error && (
          <div className="mb-5 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="displayName" className="text-sm font-bold text-[#0d3c54]">
              Display name
            </label>
            <input
              id="displayName"
              name="displayName"
              type="text"
              required
              defaultValue={initialName}
              maxLength={50}
              placeholder="Your name"
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0d3c54] transition"
            />
          </div>

          {handle && (
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-bold text-[#0d3c54]">Handle</span>
              <p className="text-sm text-gray-500 px-4 py-3 bg-gray-50 rounded-xl">
                @{handle}
                <span className="text-xs text-gray-400 ml-2">(can&apos;t change this yet)</span>
              </p>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="bio" className="text-sm font-bold text-[#0d3c54]">
              Bio <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              id="bio"
              name="bio"
              defaultValue={initialBio}
              maxLength={160}
              rows={3}
              placeholder="Tell people a bit about yourself"
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0d3c54] transition resize-none"
            />
          </div>

          <div className="flex flex-col gap-3 mt-2">
            <button
              type="submit"
              disabled={pending || avatarUploading}
              className="w-full rounded-full bg-[#0d3c54] py-3.5 text-sm font-bold text-white hover:bg-[#0a2f42] transition-colors disabled:opacity-60"
            >
              {pending
                ? <span className="flex items-center justify-center gap-2">Saving <LoadingDots /></span>
                : "Save changes"}
            </button>
            <button
              type="button"
              disabled={pending || avatarUploading}
              onClick={() => router.back()}
              className="w-full rounded-full border border-gray-200 py-3.5 text-sm font-bold text-gray-500 hover:border-[#0d3c54]/30 transition-colors disabled:opacity-40"
            >
              Cancel
            </button>
          </div>
        </form>
      </main>

      <BottomNav />
    </div>
  );
}
