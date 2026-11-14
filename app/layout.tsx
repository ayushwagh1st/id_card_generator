import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Inter, Geist_Mono, Noto_Sans_Devanagari } from "next/font/google";
import "./globals.css";
import "./workspace.css";
import { Toaster } from "@/components/ui/sonner";
import { PWAInstaller } from "@/components/PWAInstaller";
import { ThemeProvider } from "@/components/ThemeProvider";
import { SyncProvider } from "@/components/SyncProvider";
import { AppInstallProvider } from "@/components/AppInstallProvider";

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
  icons: { apple: '/icons/apple-touch-icon.png' },
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
  themeColor: "#f8f5ee",
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
      <head><meta name="event-offline-build" content={process.env.NEXT_PUBLIC_OFFLINE_BUILD_ID || 'development'} /></head>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <AppInstallProvider>
          <SyncProvider>
            <PWAInstaller />
            {children}
            <Toaster />
          </SyncProvider>
          </AppInstallProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
