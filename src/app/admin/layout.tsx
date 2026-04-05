import { AdminAuthGate } from "@/components/admin/AdminAuthGate";
import { BRAND_NAME } from "@/lib/brand";
import { publicAsset } from "@/lib/basePath";
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  manifest: publicAsset("/admin/manifest.webmanifest"),
  title: {
    default: "Admin",
    template: `%s — ${BRAND_NAME} Staff`,
  },
  applicationName: `${BRAND_NAME} Staff`,
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: `${BRAND_NAME} Staff`,
  },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: [{ media: "(prefers-color-scheme: light)", color: "#64748b" }],
  width: "device-width",
  initialScale: 1,
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-100">
      <AdminAuthGate>{children}</AdminAuthGate>
    </div>
  );
}
