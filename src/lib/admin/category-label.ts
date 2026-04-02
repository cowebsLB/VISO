/** Turn DB slug (bread, cookies) into a short label for dropdowns. */
export function categoryMenuLabel(slug: string): string {
  if (!slug) return "—";
  return slug
    .split(/[-_]/g)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
