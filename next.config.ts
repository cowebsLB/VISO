import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** GitHub project Pages URL path, e.g. /VISO for cowebslb.github.io/VISO/ */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

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
    remotePatterns: [],
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
