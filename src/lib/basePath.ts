import { getEffectiveBasePath } from "@/lib/effective-base-path";

/** GitHub Pages subpath in prod; empty in local `next dev` unless force flag (see `effective-base-path.ts`). */
export const basePath = getEffectiveBasePath();

const DEFAULT_SITE_URL = "https://cowebslb.github.io/VISO";

/**
 * Canonical site URL including path (no trailing slash).
 * Empty/whitespace `NEXT_PUBLIC_SITE_URL` must fall back: otherwise `metadataBase` in root layout
 * becomes `new URL("/")` and throws → 500 on every page (and a client hydration mismatch).
 */
function resolveSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw) return DEFAULT_SITE_URL;
  try {
    const u = new URL(raw);
    if (u.protocol !== "http:" && u.protocol !== "https:") return DEFAULT_SITE_URL;
    const path = u.pathname.replace(/\/$/, "");
    return path ? `${u.origin}${path}` : u.origin;
  } catch {
    return DEFAULT_SITE_URL;
  }
}

export const siteUrl = resolveSiteUrl();

/**
 * Safe `metadataBase` for root `layout.tsx`. A bad `NEXT_PUBLIC_SITE_URL` should never take down every route.
 */
export function metadataBaseUrl(): URL {
  const base = siteUrl.replace(/\/$/, "");
  try {
    const u = new URL(`${base}/`);
    if (u.protocol !== "http:" && u.protocol !== "https:") {
      return new URL(`${DEFAULT_SITE_URL}/`);
    }
    return u;
  } catch {
    return new URL(`${DEFAULT_SITE_URL}/`);
  }
}

/** Prefix paths to files in `public/` when using a GitHub Pages project subpath. */
export function publicAsset(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${basePath}${p}`;
}
