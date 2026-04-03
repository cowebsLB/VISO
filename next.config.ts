import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Keep in sync with `src/lib/effective-base-path.ts` (next.config cannot import app tree reliably). */
function effectiveBasePath(): string {
  const raw = process.env.NEXT_PUBLIC_BASE_PATH?.trim() || "";
  const forceInDev = process.env.NEXT_PUBLIC_FORCE_BASE_PATH_IN_DEV === "true";
  if (process.env.NODE_ENV === "development" && raw && !forceInDev) {
    return "";
  }
  return raw;
}

const basePath = effectiveBasePath();

/**
 * `output: "export"` is required for `next build` (GitHub Pages), but with it enabled while
 * running `next dev`, webpack emits production-style hashed chunks while the dev HTML still
 * requests `main-app.js`, `layout.css`, etc. → 404. Enable static export only for build.
 */
/** `start` must match a prior `build` that used `output: "export"`. */
const useStaticExport =
  process.argv.includes("build") ||
  process.argv.includes("start") ||
  process.env.npm_lifecycle_event === "build" ||
  process.env.npm_lifecycle_event === "start";

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
  ...(useStaticExport ? { output: "export" as const } : {}),
  outputFileTracingRoot: path.join(__dirname),
  basePath: basePath || undefined,
  assetPrefix: basePath || undefined,
  experimental: {
    devtoolSegmentExplorer: false,
  },
  images: {
    unoptimized: true,
    remotePatterns: (() => {
      const p = supabaseStorageRemotePattern();
      return p ? [p] : [];
    })(),
  },
  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = false;
    }
    return config;
  },
};

export default withSerwist(nextConfig);
