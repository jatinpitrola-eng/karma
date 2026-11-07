import type { Metadata, Viewport } from "next";
import { Inter, Noto_Sans_Devanagari, Noto_Sans_Gujarati } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { AppShell } from "@/components/layout/app-shell";
import { SplashScreen } from "@/components/brand/splash-screen";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const devanagari = Noto_Sans_Devanagari({ subsets: ["devanagari"], variable: "--font-devanagari", display: "swap" });
const gujarati = Noto_Sans_Gujarati({ subsets: ["gujarati"], variable: "--font-gujarati", display: "swap" });

export const metadata: Metadata = {
  title: "KARMA — India's Auto Parts Marketplace",
  description:
    "Buy chains, sprockets, gearbox parts, belts, brakes, clutch plates, filters and oils for your bike & car from verified retailers across India.",
  manifest: "/manifest.json",
  applicationName: "KARMA",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "KARMA",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.webp", sizes: "512x512", type: "image/webp" },
    ],
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5, // user-scalable allowed (no user-scalable=no)
  userScalable: true,
  themeColor: "#2874F0",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`antialiased bg-background text-foreground ${inter.variable} ${devanagari.variable} ${gujarati.variable}`}
        style={{ fontFamily: "var(--font-inter), var(--font-devanagari), var(--font-gujarati), system-ui, -apple-system, sans-serif" }}
      >
        <Providers>
          <AppShell>{children}</AppShell>
          <SplashScreen />
        </Providers>
      </body>
    </html>
  );
}
