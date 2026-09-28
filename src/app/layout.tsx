import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import { AppShell } from "@/components/layout/app-shell";

export const metadata: Metadata = {
  title: "PartKart — India's Auto Parts Marketplace",
  description:
    "Buy chains, sprockets, gearbox parts, belts, brakes, clutch plates, filters and oils for your bike & car from verified retailers across India.",
  manifest: "/manifest.json",
  applicationName: "PartKart",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "PartKart",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icons/icon-192.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5, // user-scalable allowed (no user-scalable=no)
  userScalable: true,
  themeColor: "#FFC107",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased bg-background text-foreground">
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
