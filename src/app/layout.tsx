import { ClientProviders } from "@/components/ClientProviders";
import {
  Fraunces,
  Noto_Sans,
  Noto_Sans_Arabic,
  Noto_Sans_Armenian,
} from "next/font/google";
import type { Metadata, Viewport } from "next";
import { publicAsset, siteUrl } from "@/lib/basePath";
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

const canonicalBase = siteUrl.replace(/\/$/, "");

export const metadata: Metadata = {
  metadataBase: new URL(`${canonicalBase}/`),
  title: { default: "VISO — Home bakery", template: "%s — VISO" },
  description:
    "Fresh sourdough, cakes, and treats from VISO. Order via WhatsApp.",
  icons: {
    icon: [
      {
        url: publicAsset("/favicon-16x16.png"),
        sizes: "16x16",
        type: "image/png",
      },
      {
        url: publicAsset("/favicon-32x32.png"),
        sizes: "32x32",
        type: "image/png",
      },
    ],
    apple: {
      url: publicAsset("/apple-touch-icon.png"),
      sizes: "180x180",
      type: "image/png",
    },
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
    images: [
      {
        url: `${canonicalBase}/android-chrome-512x512.png`,
        width: 512,
        height: 512,
        alt: "VISO Bakery",
      },
    ],
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
