import Link from "next/link";
import Image from "next/image";
import StarRating from "@/components/star-rating";

interface WhiskeyCardProps {
  whiskey: {
    id: string;
    name: string;
    brand: string;
    category: string;
    proof: number | null;
    ageYears: number | null;
    imageUrl: string;
    avgRating: number | null;
    reviewCount: number;
  };
}

const CATEGORY_LABELS: Record<string, string> = {
  BOURBON: "Bourbon",
  RYE: "Rye",
  TENNESSEE: "Tennessee",
  SCOTCH: "Scotch",
  IRISH: "Irish",
  JAPANESE: "Japanese",
  OTHER: "Other",
  ZERO_PROOF: "Zero-Proof",
};

export default function WhiskeyCard({ whiskey }: WhiskeyCardProps) {
  return (
    <Link
      href={`/whiskey/${whiskey.id}`}
      className="flex items-center gap-4 bg-white rounded-2xl border border-gray-100 shadow-sm p-3 hover:border-[#0d3c54]/20 transition-colors active:scale-[0.98]"
    >
      {/* Bottle image */}
      <div className="w-14 h-20 rounded-xl bg-[#fffbfa] border border-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
        <Image
          src={whiskey.imageUrl}
          alt={whiskey.name}
          width={40}
          height={72}
          className="object-contain"
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <p className="text-sm font-bold text-[#0d3c54] truncate">{whiskey.name}</p>
        <p className="text-xs text-gray-500 truncate">{whiskey.brand}</p>

        <div className="flex items-center gap-2 flex-wrap mt-0.5">
          <span className="text-[10px] font-bold uppercase tracking-wide text-[#551904] bg-[#551904]/8 rounded-full px-2 py-0.5">
            {CATEGORY_LABELS[whiskey.category] ?? whiskey.category}
          </span>
          {whiskey.proof != null && (
            <span className="text-[10px] text-gray-400">{whiskey.proof} proof</span>
          )}
          {whiskey.ageYears && (
            <span className="text-[10px] text-gray-400">{whiskey.ageYears} yr</span>
          )}
        </div>

        <div className="flex items-center gap-2 mt-0.5">
          {whiskey.avgRating !== null ? (
            <>
              <StarRating rating={whiskey.avgRating} size="sm" />
              <span className="text-xs text-gray-400">
                ({whiskey.reviewCount} {whiskey.reviewCount === 1 ? "review" : "reviews"})
              </span>
            </>
          ) : (
            <span className="text-xs text-gray-400">No reviews yet</span>
          )}
        </div>
      </div>
    </Link>
  );
}
