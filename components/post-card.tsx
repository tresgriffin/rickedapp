import Link from "next/link";
import Image from "next/image";
import { Share2 } from "lucide-react";
import Avatar from "@/components/avatar";
import LikeButton from "@/components/like-button";
import CommentSection from "@/components/comment-section";
import { timeAgo } from "@/lib/format";
import type { CommentWithUser } from "@/lib/actions/comment";

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
  isLiked: boolean;
  initialComments: CommentWithUser[];
}

export default function PostCard({ post, isLiked, initialComments }: PostCardProps) {
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

      {/* Photo */}
      {post.mediaUrl && (
        <div className="rounded-xl overflow-hidden relative aspect-[4/3] bg-gray-100">
          <Image
            src={post.mediaUrl}
            alt="Post photo"
            fill
            sizes="(max-width: 640px) 100vw, 600px"
            className="object-cover"
          />
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

      {/* Actions */}
      <div className="flex items-center gap-5 pt-1 border-t border-gray-50">
        <LikeButton
          targetType="POST"
          targetId={post.id}
          initialLiked={isLiked}
          initialCount={post.likeCount}
        />
        <CommentSection
          targetType="POST"
          targetId={post.id}
          initialComments={initialComments}
          initialCount={post.commentCount}
        />
        {/* Share — wired in a future phase */}
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
