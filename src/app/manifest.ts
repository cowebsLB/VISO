import type { MetadataRoute } from "next";
import { publicAsset } from "@/lib/basePath";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  const icon = publicAsset("/viso-logo.jpg");
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
        src: icon,
        sizes: "512x512",
        type: "image/jpeg",
        purpose: "any",
      },
      {
        src: icon,
        sizes: "512x512",
        type: "image/jpeg",
        purpose: "maskable",
      },
    ],
  };
}
