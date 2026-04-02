import { getEffectiveBasePath } from "@/lib/effective-base-path";

/** GitHub Pages subpath in prod; empty in local `next dev` unless force flag (see `effective-base-path.ts`). */
export const basePath = getEffectiveBasePath();

/** Canonical site URL including path (no trailing slash). */
export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://cowebslb.github.io/VISO";

/** Prefix paths to files in `public/` when using a GitHub Pages project subpath. */
export function publicAsset(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${basePath}${p}`;
}
