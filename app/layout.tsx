import type { Metadata } from "next";
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
  description: "Discover, rate, and share your favorite bourbons and whiskeys.",
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
      <body className="min-h-full flex flex-col bg-[#fffbfa]">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
