import type { Metadata, Viewport } from "next";
import { Abhaya_Libre, Inter } from "next/font/google";
import Providers from "./providers";
import "./globals.css";

const abhayaLibre = Abhaya_Libre({
  weight: ["700"],
  variable: "--font-abhaya-libre",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  weight: ["400", "700"],
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Ricked",
  description: "Discover, rate, and share your favorite whiskeys and cocktails.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/ricked-assets/icon-32.svg", type: "image/svg+xml" },
      { url: "/ricked-assets/icon-32.png", type: "image/png" },
    ],
    apple: "/ricked-assets/icon-180.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Ricked",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // userScalable and maximumScale removed — pinch-zoom must remain accessible.
  // iOS auto-zoom on focus is prevented instead by setting all inputs to text-base (16px).
  viewportFit: "cover",
  themeColor: "#0d3c54",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${abhayaLibre.variable} ${inter.variable} h-full`}
    >
      <head>
        {/* Manual injection bypasses Next.js metadata API to guarantee rel→media→href attribute order, which iOS startup image parsing requires */}
        <link rel="apple-touch-startup-image" media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" href="/ricked-assets/splash/splash-1125x2436.png" />
        <link rel="apple-touch-startup-image" media="(device-width: 360px) and (device-height: 780px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" href="/ricked-assets/splash/splash-1080x2340.png" />
        <link rel="apple-touch-startup-image" media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" href="/ricked-assets/splash/splash-1170x2532.png" />
        <link rel="apple-touch-startup-image" media="(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" href="/ricked-assets/splash/splash-1179x2556.png" />
        <link rel="apple-touch-startup-image" media="(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" href="/ricked-assets/splash/splash-1284x2778.png" />
        <link rel="apple-touch-startup-image" media="(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" href="/ricked-assets/splash/splash-1290x2796.png" />
      </head>
      <body className="min-h-full flex flex-col bg-[#fffbfa]">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
