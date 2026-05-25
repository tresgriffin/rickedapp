import { ImageResponse } from "next/og";
import { readFileSync } from "fs";
import { join } from "path";
import { NextRequest } from "next/server";

export const runtime = "nodejs";

// Cached after first read — warm function instances reuse it
let logoDataUrl: string | null = null;

function getLogoDataUrl(): string {
  if (!logoDataUrl) {
    const buf = readFileSync(
      join(process.cwd(), "public/ricked-assets/ricked-lockup-vertical-light.png")
    );
    logoDataUrl = `data:image/png;base64,${buf.toString("base64")}`;
  }
  return logoDataUrl;
}

export function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const w = parseInt(searchParams.get("w") ?? "1170", 10);
  const h = parseInt(searchParams.get("h") ?? "2532", 10);

  // Vertical lockup natural ratio: 1150×1288
  const logoWidth = Math.round(w * 0.4);
  const logoHeight = Math.round(logoWidth * (1288 / 1150));

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          background: "#0d3c54",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <img
          src={getLogoDataUrl()}
          width={logoWidth}
          height={logoHeight}
          style={{ objectFit: "contain" }}
        />
      </div>
    ),
    { width: w, height: h }
  );
}
