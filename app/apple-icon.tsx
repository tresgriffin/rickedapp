import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// FUTURE: design system pass — replace with production brand icon in Phase 8b
export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        background: "#0d3c54",
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "40px",
      }}
    >
      <svg
        width="110"
        height="110"
        viewBox="0 0 24 24"
        fill="none"
      >
        <path d="M3 4 L21 4 L18.5 20 L5.5 20 Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round" fill="none" />
        <path d="M5.1 14.25 L18.9 14.25 L18.5 20 L5.5 20 Z" fill="white" opacity="0.7" />
      </svg>
    </div>,
    { ...size }
  );
}
