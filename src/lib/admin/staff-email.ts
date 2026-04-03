/**
 * Staff logins are **usernames** in the UI. Supabase Auth (email provider) still needs an
 * email-shaped `auth.users.email`, so we map `christian` → `christian@viso-admin.local`
 * only for the API call — staff never use email addresses day to day.
 *
 * The `viso-admin.local` domain is a legacy synthetic host kept so existing Auth users
 * continue to match; do not change without migrating `auth.users.email` in Supabase.
 */
export const STAFF_EMAIL_DOMAIN = "viso-admin.local";

/** Lowercase username; if user pasted `name@anything`, keep only the part before `@`. */
export function normalizeStaffUsername(raw: string): string {
  const t = raw.trim().toLowerCase();
  const at = t.indexOf("@");
  return at === -1 ? t : t.slice(0, at).trim();
}

export function staffEmailFromUsername(username: string): string {
  const u = normalizeStaffUsername(username);
  if (!u) return "";
  return `${u}@${STAFF_EMAIL_DOMAIN}`;
}

/**
 * Value for `signInWithPassword({ email })`.
 * - No `@` → synthetic staff email (`name` → `name@viso-admin.local`).
 * - Contains `@` → use trimmed input as the Auth email (Dashboard invites with a real address).
 */
export function resolveStaffAuthEmail(raw: string): string {
  const t = raw.trim();
  if (!t) return "";
  if (t.includes("@")) return t.toLowerCase();
  return staffEmailFromUsername(t);
}
