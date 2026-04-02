import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** GitHub project Pages URL path, e.g. /VISO for cowebslb.github.io/VISO/ */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

function supabaseStorageRemotePattern():
  | { protocol: "https"; hostname: string; pathname: string }
  | undefined {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!raw) return undefined;
  try {
    const u = new URL(raw);
    if (u.protocol !== "https:") return undefined;
    return {
      protocol: "https",
      hostname: u.hostname,
      pathname: "/storage/v1/object/public/**",
    };
  } catch {
    return undefined;
  }
}

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  output: "export",
  outputFileTracingRoot: path.join(__dirname),
  basePath: basePath || undefined,
  assetPrefix: basePath || undefined,
  images: {
    unoptimized: true,
    remotePatterns: (() => {
      const p = supabaseStorageRemotePattern();
      return p ? [p] : [];
    })(),
  },
  // Windows: webpack persistent cache can corrupt (ENOENT chunks / manifest) when .next is
  // cleared mid-dev or antivirus locks files; disabling dev cache avoids bad chunk refs.
  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = false;
    }
    return config;
  },
};

export default withSerwist(nextConfig);
