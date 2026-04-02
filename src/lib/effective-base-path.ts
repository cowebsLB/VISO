/**
 * Single source for URL prefix: GitHub Pages `/VISO` in production builds; stripped in
 * `next dev` unless `NEXT_PUBLIC_FORCE_BASE_PATH_IN_DEV=true`. Keep in sync with consumer
 * expectations in `next.config.ts` (import this module there).
 */
export function getEffectiveBasePath(): string {
  const raw = process.env.NEXT_PUBLIC_BASE_PATH?.trim() || "";
  const forceInDev = process.env.NEXT_PUBLIC_FORCE_BASE_PATH_IN_DEV === "true";
  if (process.env.NODE_ENV === "development" && raw && !forceInDev) {
    return "";
  }
  return raw;
}
