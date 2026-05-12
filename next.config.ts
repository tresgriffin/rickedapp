import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Match the 10 MB upload limit in lib/upload.ts, +1 MB for multipart overhead
      bodySizeLimit: "11mb",
    },
  },
  images: {
    remotePatterns: [
      {
        // Vercel Blob public URLs
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
    ],
  },
};

export default nextConfig;
