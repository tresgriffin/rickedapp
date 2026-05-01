"use client";

import { useState } from "react";

interface StarSelectorProps {
  value: number; // 0 = nothing selected yet
  onChange: (rating: number) => void;
  size?: number;
}

export default function StarSelector({ value, onChange, size = 36 }: StarSelectorProps) {
  const [hovered, setHovered] = useState(0);

  const active = hovered > 0 ? hovered : value;

  return (
    <div
      className="flex items-center gap-1"
      role="radiogroup"
      aria-label="Star rating"
      onMouseLeave={() => setHovered(0)}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={value === star}
          aria-label={`${star} star${star === 1 ? "" : "s"}`}
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          className="focus:outline-none focus-visible:ring-2 focus-visible:ring-[#551904] rounded"
        >
          <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="transition-colors duration-75"
          >
            <path
              d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
              fill={active >= star ? "#551904" : "none"}
              stroke="#551904"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      ))}
    </div>
  );
}
