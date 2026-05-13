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
import { requestEmailChange, cancelEmailChange } from "@/lib/actions/email-change";

interface Props {
  displayName: string;
  bio: string;
  handle: string | null;
  avatarUrl: string | null;
  currentEmail: string;
  isOAuthOnly: boolean;
  pendingEmail: string | null;
  emailChangeStatus: string | null; // from ?email_change= query param
}

const EMAIL_CHANGE_MESSAGES: Record<string, string> = {
  invalid: "That verification link is invalid or has already been used.",
  expired: "That verification link expired. Request a new one below.",
  claimed: "That email is no longer available — someone else claimed it before you could verify. Try a different one.",
};

export default function ProfileEditClient({
  displayName: initialName,
  bio: initialBio,
  handle,
  avatarUrl: initialAvatarUrl,
  currentEmail,
  isOAuthOnly,
  pendingEmail: initialPendingEmail,
  emailChangeStatus,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Email change state
  const [emailInput, setEmailInput] = useState("");
  const [pendingEmail, setPendingEmail] = useState(initialPendingEmail);
  const [emailPending, startEmailTransition] = useTransition();
  const [emailError, setEmailError] = useState(
    emailChangeStatus ? (EMAIL_CHANGE_MESSAGES[emailChangeStatus] ?? "") : ""
  );
  const [emailSuccess, setEmailSuccess] = useState("");
  const [cancelling, setCancelling] = useState(false);

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
      setAvatarError("Upload failed. Check your connection or try a smaller image.");
    } finally {
      setAvatarUploading(false);
    }

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

  async function handleEmailChange(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEmailError("");
    setEmailSuccess("");
    const formData = new FormData(e.currentTarget);
    startEmailTransition(async () => {
      const result = await requestEmailChange(formData);
      if ("error" in result) {
        setEmailError(result.error);
      } else {
        setPendingEmail(emailInput);
        setEmailInput("");
        setEmailSuccess(`Verification email sent to ${emailInput}. Check your inbox.`);
      }
    });
  }

  async function handleCancelEmailChange() {
    setCancelling(true);
    await cancelEmailChange();
    setPendingEmail(null);
    setEmailSuccess("");
    setEmailError("");
    setCancelling(false);
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
              {avatarUploading ? <LoadingDots /> : <Camera size={18} className="text-white" />}
            </div>
          </button>
          <p className="text-xs text-gray-400 mt-2">
            {avatarUploading ? "Uploading…" : "Tap to change photo"}
          </p>
          {avatarError && <p className="text-xs text-red-600 mt-1 text-center">{avatarError}</p>}
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

        {/* Profile form — display name + bio */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 mb-8">
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
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-base text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0d3c54] transition"
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
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-base text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0d3c54] transition resize-none"
            />
          </div>

          <div className="flex flex-col gap-3">
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

        {/* Email section */}
        <div className="border-t border-gray-100 pt-6">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#0d3c54] mb-4">
            Email address
          </h2>

          {isOAuthOnly ? (
            <div className="rounded-xl bg-gray-50 border border-gray-200 px-4 py-3">
              <p className="text-sm text-gray-500">
                {currentEmail}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Your account uses Google sign-in. To change your email, update it in your Google account.
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-xl bg-gray-50 border border-gray-200 px-4 py-3 mb-4">
                <p className="text-sm text-gray-700 font-medium">{currentEmail}</p>
                <p className="text-xs text-gray-400 mt-0.5">Current email</p>
              </div>

              {/* Pending state */}
              {pendingEmail && (
                <div className="mb-4 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
                  <p className="text-sm text-amber-800 font-medium">
                    Pending verification: {pendingEmail}
                  </p>
                  <p className="text-xs text-amber-700 mt-0.5 mb-2">
                    Check your inbox and click the link to confirm. Your current email stays active until then.
                  </p>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={handleCancelEmailChange}
                      disabled={cancelling}
                      className="text-xs font-bold text-amber-700 hover:text-amber-900 transition-colors disabled:opacity-50"
                    >
                      {cancelling ? "Cancelling…" : "Cancel change"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEmailInput(pendingEmail);
                        setPendingEmail(null);
                      }}
                      className="text-xs font-bold text-amber-700 hover:text-amber-900 transition-colors"
                    >
                      Resend verification
                    </button>
                  </div>
                </div>
              )}

              {emailError && (
                <p className="text-sm text-red-600 mb-3">{emailError}</p>
              )}
              {emailSuccess && (
                <p className="text-sm text-green-700 mb-3">{emailSuccess}</p>
              )}

              {/* Change email form */}
              {!pendingEmail && (
                <form onSubmit={handleEmailChange} className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="email" className="text-sm font-bold text-[#0d3c54]">
                      New email address
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={emailInput}
                      onChange={(e) => { setEmailInput(e.target.value); setEmailError(""); setEmailSuccess(""); }}
                      placeholder="new@example.com"
                      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-base text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0d3c54] transition"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={emailPending || !emailInput.trim()}
                    className="self-start rounded-full bg-[#0d3c54] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#0a2f42] transition-colors disabled:opacity-50"
                  >
                    {emailPending
                      ? <span className="flex items-center gap-2">Sending <LoadingDots /></span>
                      : "Send verification email"}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
