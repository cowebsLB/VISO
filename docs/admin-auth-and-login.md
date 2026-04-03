# Admin authentication and login

Staff routes under **`/admin`** use Supabase Auth (email/password) with RLS policies that call **`public.is_admin()`** (user must appear in **`public.admins`**).

## Login page (`src/app/admin/login/page.tsx`)

- **Field label:** “Email or username”.
- **Synthetic staff emails:** If the value has **no** `@`, it is treated as a username and sent to Supabase as **`username@viso-admin.local`** (see `src/lib/admin/staff-email.ts`, constants `STAFF_EMAIL_DOMAIN`).
- **Real emails (e.g. Gmail):** If the value **contains** `@`, the trimmed string (lowercased) is used **as-is** for `signInWithPassword({ email })`. This matches users created in the Dashboard with addresses like `name@gmail.com`.
- **After successful sign-in:** `router.replace("/admin")` runs immediately so the user does not need a full page reload.

### Helpers (`src/lib/admin/staff-email.ts`)

| Function | Role |
|----------|------|
| `normalizeStaffUsername` | Trims, lowercases; if user pasted `foo@bar`, keeps only `foo` for synthetic mapping. |
| `staffEmailFromUsername` | Builds `user@viso-admin.local`. |
| `resolveStaffAuthEmail` | If input contains `@`, returns full email; else returns `staffEmailFromUsername`. |

### Error messages shown in the UI

- **Email not confirmed:** Points to Supabase → Authentication → confirm user or disable confirm-email for testing.
- **Invalid / 400:** Explains mismatch between typed value and Auth email, and mentions both synthetic domain and full-email sign-in.

## Auth gate (`src/components/admin/AdminAuthGate.tsx`)

- On mount, **`getSession()`** decides: no session + not on login → redirect to **`/admin/login`**; session + on login → redirect to **`/admin`**.
- **`onAuthStateChange`** must also redirect **on sign-in** while on the login route (not only on sign-out). Otherwise, after client-side login, the user stayed on `/admin/login` until a manual reload.

## Sign out (`src/components/admin/AdminUserMenu.tsx`)

- **`signOut({ scope: "local" })`** clears the session in this browser **without** calling the global GoTrue logout endpoint that could return **403** with the anon key (`/auth/v1/logout?scope=global`).
- After sign-out, **`router.replace("/admin/login")`**.

## Layout

- **`src/app/admin/layout.tsx`** wraps all admin routes with **`AdminAuthGate`**.

## Order notifications (admin)

In **production** (service worker enabled), staff can turn on **order notifications** from the bar below the admin nav. The page asks for **Notification** permission, then **polls** for new rows in **`orders`** every 45 seconds (only while the tab is open). The **same Serwist service worker** (`src/app/sw.ts`) shows the notification via a **`message`** handler; **`notificationclick`** focuses an open `/admin` tab or opens **Orders**. In **`next dev`**, Serwist is disabled (`ClientProviders`), so a short notice is shown instead—use **`npm run build`** + **`npm run start`** to test notifications locally.

## Related

- [seed-admins.md](./seed-admins.md) — creating users and `admins` rows.
- [catalog-storage-and-staff.md](./catalog-storage-and-staff.md) — `getStaffSupabase()` and staff verification for data operations.
