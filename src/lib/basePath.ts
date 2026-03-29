/** Set to your GitHub project path (e.g. `/VISO`) when deploying to GitHub Pages. */
export const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** Canonical site URL including path (no trailing slash). */
export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://cowebslb.github.io/VISO";

/** Prefix paths to files in `public/` when using a GitHub Pages project subpath. */
export function publicAsset(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${basePath}${p}`;
}
