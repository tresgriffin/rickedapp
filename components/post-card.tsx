import Link from "next/link";
import { Heart, MessageCircle, Share2 } from "lucide-react";
import Avatar from "@/components/avatar";
import { timeAgo } from "@/lib/format";

interface PostCardProps {
  post: {
    id: string;
    body: string;
    createdAt: Date;
    mediaUrl: string | null;
    user: {
      handle: string | null;
      displayName: string | null;
      avatarUrl: string | null;
    };
    taggedWhiskey: { id: string; name: string; brand: string } | null;
    likeCount: number;
    commentCount: number;
  };
}

export default function PostCard({ post }: PostCardProps) {
  return (
    <article className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href={post.user.handle ? `/profile/${post.user.handle}` : "#"}
          className="flex-shrink-0"
          tabIndex={post.user.handle ? 0 : -1}
        >
          <Avatar
            displayName={post.user.displayName}
            avatarUrl={post.user.avatarUrl}
            size="md"
          />
        </Link>
        <div className="flex-1 min-w-0">
          <Link
            href={post.user.handle ? `/profile/${post.user.handle}` : "#"}
            className="text-sm font-bold text-[#0d3c54] truncate hover:underline block"
          >
            {post.user.displayName ?? post.user.handle ?? "Someone"}
          </Link>
          <p className="text-xs text-gray-400">
            @{post.user.handle} · {timeAgo(post.createdAt)}
          </p>
        </div>
      </div>

      {/* Body */}
      <p className="text-sm text-black leading-relaxed">{post.body}</p>

      {/* Optional image placeholder */}
      {post.mediaUrl && (
        <div className="rounded-xl overflow-hidden bg-gray-100 aspect-video">
          {/* Phase 4: swap for real <Image> once uploads land */}
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
            Photo
          </div>
        </div>
      )}

      {/* Tagged whiskey chip */}
      {post.taggedWhiskey && (
        <Link
          href={`/whiskey/${post.taggedWhiskey.id}`}
          className="self-start inline-flex items-center gap-1.5 rounded-full bg-[#fffbfa] border border-[#551904]/20 px-3 py-1 text-xs font-bold text-[#551904] hover:bg-[#551904]/5 transition-colors"
        >
          🥃 {post.taggedWhiskey.name}
        </Link>
      )}

      {/* Actions row — wired in Phase 5 */}
      <div className="flex items-center gap-5 pt-1 border-t border-gray-50">
        <button
          type="button"
          className="flex items-center gap-1.5 text-gray-400 hover:text-[#551904] transition-colors"
          aria-label={`${post.likeCount} likes`}
        >
          <Heart size={16} strokeWidth={1.5} />
          <span className="text-xs font-medium">{post.likeCount}</span>
        </button>
        <button
          type="button"
          className="flex items-center gap-1.5 text-gray-400 hover:text-[#0d3c54] transition-colors"
          aria-label={`${post.commentCount} comments`}
        >
          <MessageCircle size={16} strokeWidth={1.5} />
          <span className="text-xs font-medium">{post.commentCount}</span>
        </button>
        <button
          type="button"
          className="flex items-center gap-1.5 text-gray-400 hover:text-[#0d3c54] transition-colors ml-auto"
          aria-label="Share"
        >
          <Share2 size={16} strokeWidth={1.5} />
        </button>
      </div>
    </article>
  );
}
