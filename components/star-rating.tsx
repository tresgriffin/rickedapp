interface StarRatingProps {
  rating: number; // 0–5, supports .5 increments
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
}

const SIZES = { sm: 14, md: 18, lg: 26 };

function Star({ fill, size }: { fill: "full" | "half" | "empty"; size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="flex-shrink-0"
    >
      <defs>
        {fill === "half" && (
          <linearGradient id="half-fill">
            <stop offset="50%" stopColor="#551904" />
            <stop offset="50%" stopColor="transparent" />
          </linearGradient>
        )}
      </defs>
      <path
        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
        fill={
          fill === "full"
            ? "#551904"
            : fill === "half"
            ? "url(#half-fill)"
            : "none"
        }
        stroke="#551904"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function StarRating({
  rating,
  size = "md",
  showValue = false,
}: StarRatingProps) {
  const px = SIZES[size];

  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={px}
          fill={rating >= star ? "full" : rating >= star - 0.5 ? "half" : "empty"}
        />
      ))}
      {showValue && (
        <span className="ml-1 text-sm font-bold text-[#551904]">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}
