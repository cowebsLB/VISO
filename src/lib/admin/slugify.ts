/** Safe URL / DB id segment from a human label (product or option name). */
export function slugifyForId(input: string): string {
  const s = input
    .trim()
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
  return s || "item";
}

export function uniqueSlug(base: string, taken: Set<string>): string {
  let id = slugifyForId(base);
  if (!taken.has(id)) return id;
  let n = 2;
  while (taken.has(`${id}-${n}`)) n += 1;
  return `${id}-${n}`;
}
