import { ImageResponse } from "next/og";

// FUTURE: design system pass — replace with production brand icon in Phase 8b
export function GET() {
  return new ImageResponse(
    <div
      style={{
        background: "#0d3c54",
        width: "512px",
        height: "512px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg
        width="320"
        height="320"
        viewBox="0 0 24 24"
        fill="none"
      >
        <path d="M3 4 L21 4 L18.5 20 L5.5 20 Z" stroke="white" strokeWidth="2" strokeLinejoin="round" fill="none" />
        <path d="M5.1 14.25 L18.9 14.25 L18.5 20 L5.5 20 Z" fill="white" opacity="0.7" />
      </svg>
    </div>,
    { width: 512, height: 512 }
  );
}
