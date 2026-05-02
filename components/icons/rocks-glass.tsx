interface RocksGlassProps {
  size?: number;
  className?: string;
}

/**
 * A simple rocks glass (old fashioned glass) icon — short, wide, ~1:1 aspect.
 * Glass outline follows currentColor. Liquid fill is white/translucent so it
 * reads clearly against the navy circle in the Add overlay. Reserved for future
 * use in the chatbot avatar and empty states.
 */
export default function RocksGlass({ size = 24, className = "" }: RocksGlassProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Glass body: trapezoid, slightly wider at top */}
      <path
        d="M3 4 L21 4 L18.5 20 L5.5 20 Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Liquid fill at bottom ~38% — white so it reads against the navy circle */}
      <path
        d="M5.1 14.25 L18.9 14.25 L18.5 20 L5.5 20 Z"
        fill="white"
        opacity="0.7"
      />
    </svg>
  );
}
