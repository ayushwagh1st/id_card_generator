import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Inter, Geist_Mono, Noto_Sans_Devanagari } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { PWAInstaller } from "@/components/PWAInstaller";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

const notoDevanagari = Noto_Sans_Devanagari({
  variable: "--font-devanagari",
  subsets: ["devanagari"],
  weight: ["400", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Bal Pradarshani ID Portal",
  description: "Official volunteer registration, ID generation, and event management portal for Nirankari Sant Samagam.",
  manifest: "/manifest.json",
  openGraph: {
    title: "Bal Pradarshani ID Portal",
    description: "Official volunteer registration, ID generation, and event management portal for Nirankari Sant Samagam.",
    type: "website",
    locale: "en_IN",
    siteName: "Bal Pradarshani ID Portal",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#8C6DFD",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${inter.variable} ${geistMono.variable} ${notoDevanagari.variable} h-full`}
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
