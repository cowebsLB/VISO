/**
 * Staff logins are **usernames** in the UI. Supabase Auth (email provider) still needs an
 * email-shaped `auth.users.email`, so we map `christian` → `christian@viso-admin.local`
 * only for the API call — staff never use email addresses day to day.
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
