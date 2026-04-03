import type { MetadataRoute } from "next";
import { BRAND_DESCRIPTION, BRAND_NAME, BRAND_SITE_NAME } from "@/lib/brand";
import { basePath, publicAsset, siteUrl } from "@/lib/basePath";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  const icon192 = publicAsset("/android-chrome-192x192.png");
  const icon512 = publicAsset("/android-chrome-512x512.png");
  const startUrl = publicAsset("/");
  const scope = startUrl.endsWith("/") ? startUrl : `${startUrl}/`;
  const origin = siteUrl.replace(/\/$/, "");
  const id = `${origin}${basePath || ""}/`;
  return {
    id,
    name: BRAND_SITE_NAME,
    short_name: BRAND_NAME,
    description: BRAND_DESCRIPTION,
    start_url: startUrl,
    scope,
    display: "standalone",
    background_color: "#d4eaea",
    theme_color: "#ff4610",
    lang: "en",
    categories: ["food", "shopping"],
    prefer_related_applications: false,
    icons: [
      {
        src: icon192,
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: icon512,
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: icon512,
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
