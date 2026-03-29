import { ClientProviders } from "@/components/ClientProviders";
import {
  Fraunces,
  Noto_Sans,
  Noto_Sans_Arabic,
  Noto_Sans_Armenian,
} from "next/font/google";
import type { Metadata, Viewport } from "next";
import "./globals.css";

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const sans = Noto_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

const sansArabic = Noto_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "600", "700"],
  variable: "--font-sans-ar",
  display: "swap",
});

const sansArmenian = Noto_Sans_Armenian({
  subsets: ["armenian"],
  weight: ["400", "600", "700"],
  variable: "--font-sans-hy",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://viso-bakery.example.com"),
  title: { default: "VISO — Home bakery", template: "%s — VISO" },
  description:
    "Fresh sourdough, cakes, and treats from VISO. Order via WhatsApp.",
  manifest: "/manifest.webmanifest",
  icons: {
    apple: "/viso-logo.jpg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "VISO",
  },
  formatDetection: { telephone: true },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "VISO Bakery",
    images: [{ url: "/viso-logo.jpg", width: 512, height: 512, alt: "VISO" }],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ff4610" },
    { media: "(prefers-color-scheme: dark)", color: "#c4280a" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {process.env.NEXT_PUBLIC_BUILD_ID ? (
          <meta name="build-id" content={process.env.NEXT_PUBLIC_BUILD_ID} />
        ) : null}
      </head>
      <body
        className={`${display.variable} ${sans.variable} ${sansArabic.variable} ${sansArmenian.variable} min-h-screen bg-surface font-sans text-slate-800 antialiased`}
      >
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
