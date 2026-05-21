"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Trash2 } from "lucide-react";
import DeleteConfirmModal from "@/components/delete-confirm-modal";
import { deleteRecipe, deletePost, deleteConversation } from "@/lib/actions/delete";

interface OwnerActionMenuProps {
  type: "recipe" | "post" | "conversation";
  id: string;
  afterDeleteHref?: string; // navigate here after delete; if omitted, refresh
}

export default function OwnerActionMenu({ type, id, afterDeleteHref }: OwnerActionMenuProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function handleConfirmDelete() {
    setDeleting(true);
    setError("");
    const result = type === "recipe"
      ? await deleteRecipe(id)
      : type === "post"
        ? await deletePost(id)
        : await deleteConversation(id);
    setDeleting(false);
    if ("error" in result) {
      setError(result.error);
    } else {
      setConfirmOpen(false);
      if (afterDeleteHref) {
        router.push(afterDeleteHref);
      } else {
        router.refresh();
      }
    }
  }

  return (
    <>
      <div className="relative">
        {menuOpen && (
          <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
        )}
        <button
          type="button"
          onClick={() => setMenuOpen((o) => !o)}
          className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          aria-label="More options"
        >
          <MoreHorizontal size={16} />
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-full mt-1 z-20 bg-white rounded-xl border border-gray-100 shadow-lg py-1 min-w-[120px]">
            <button
              type="button"
              onClick={() => { setMenuOpen(false); setConfirmOpen(true); }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <Trash2 size={14} />
              Delete
            </button>
          </div>
        )}
      </div>

      {confirmOpen && (
        <DeleteConfirmModal
          type={type}
          onConfirm={handleConfirmDelete}
          onCancel={() => { setConfirmOpen(false); setError(""); }}
          deleting={deleting}
          error={error}
        />
      )}
    </>
  );
}
