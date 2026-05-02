import Link from "next/link";
import Image from "next/image";
import Avatar from "@/components/avatar";
import LikeButton from "@/components/like-button";
import CommentSection from "@/components/comment-section";
import { timeAgo } from "@/lib/format";
import type { CommentWithUser } from "@/lib/actions/comment";

interface RecipeCardProps {
  recipe: {
    id: string;
    title: string;
    mediaUrl: string | null;
    ingredients: unknown;
    createdAt: Date;
    user: {
      handle: string | null;
      displayName: string | null;
      avatarUrl: string | null;
    };
    likeCount: number;
    commentCount: number;
  };
  isLiked: boolean;
  initialComments: CommentWithUser[];
}

export default function RecipeCard({ recipe, isLiked, initialComments }: RecipeCardProps) {
  const ingredientCount = Array.isArray(recipe.ingredients)
    ? recipe.ingredients.length
    : 0;

  return (
    <article className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Photo */}
      {recipe.mediaUrl && (
        <div className="relative aspect-[4/3] bg-gray-100">
          <Image
            src={recipe.mediaUrl}
            alt={`${recipe.title} photo`}
            fill
            sizes="(max-width: 640px) 100vw, 600px"
            className="object-cover"
          />
        </div>
      )}

      <div className="p-4 flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link
            href={recipe.user.handle ? `/profile/${recipe.user.handle}` : "#"}
            className="flex-shrink-0"
            tabIndex={recipe.user.handle ? 0 : -1}
          >
            <Avatar
              displayName={recipe.user.displayName}
              avatarUrl={recipe.user.avatarUrl}
              size="md"
            />
          </Link>
          <div className="flex-1 min-w-0">
            <Link
              href={recipe.user.handle ? `/profile/${recipe.user.handle}` : "#"}
              className="text-sm font-bold text-[#0d3c54] truncate hover:underline block"
            >
              {recipe.user.displayName ?? recipe.user.handle ?? "Someone"}
            </Link>
            <p className="text-xs text-gray-400">
              @{recipe.user.handle} · {timeAgo(recipe.createdAt)}
            </p>
          </div>
        </div>

        {/* Title + ingredient count */}
        <Link href={`/recipe/${recipe.id}`} className="block group">
          <h3 className="font-[family-name:var(--font-abhaya-libre)] text-lg font-bold text-[#0d3c54] group-hover:underline leading-snug">
            {recipe.title}
          </h3>
          <span className="inline-block mt-1 text-[11px] font-bold uppercase tracking-wide text-[#551904] bg-[#551904]/8 rounded-full px-2 py-0.5">
            {ingredientCount} ingredient{ingredientCount === 1 ? "" : "s"}
          </span>
        </Link>

        {/* Actions */}
        <div className="flex items-center gap-5 pt-1 border-t border-gray-50">
          <LikeButton
            targetType="RECIPE"
            targetId={recipe.id}
            initialLiked={isLiked}
            initialCount={recipe.likeCount}
          />
          <CommentSection
            targetType="RECIPE"
            targetId={recipe.id}
            initialComments={initialComments}
            initialCount={recipe.commentCount}
          />
        </div>
      </div>
    </article>
  );
}
