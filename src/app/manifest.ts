import type { MetadataRoute } from "next";
import { publicAsset } from "@/lib/basePath";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  const icon192 = publicAsset("/android-chrome-192x192.png");
  const icon512 = publicAsset("/android-chrome-512x512.png");
  return {
    name: "VISO Bakery",
    short_name: "VISO",
    description:
      "Home bakery — fresh sourdough, cakes, and treats. Order via WhatsApp.",
    start_url: publicAsset("/"),
    display: "standalone",
    background_color: "#d4eaea",
    theme_color: "#ff4610",
    lang: "en",
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
