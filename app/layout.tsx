import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Inter, Geist_Mono, Noto_Sans_Devanagari, Cormorant_Garamond, Montserrat } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

const notoDevanagari = Noto_Sans_Devanagari({
  variable: "--font-devanagari",
  subsets: ["devanagari"],
  weight: ["400", "600", "700", "900"],
});

export const metadata: Metadata = {
  title: "Bal Pradarshani ID Portal",
  description: "Magical exhibition volunteer ID generation and management system.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#8C6DFD",
};

import { PWAInstaller } from "@/components/PWAInstaller";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${inter.variable} ${geistMono.variable} ${notoDevanagari.variable} ${cormorant.variable} ${montserrat.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <PWAInstaller />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
