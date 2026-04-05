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

## GitHub Pages (`/VISO`) — avoid “kicked out” to the wrong site

- **Next.js `Link`:** Always use **root-relative paths without the base path** (e.g. **`href="/"`**, **`href="/admin/login"`**). **`next.config`** **`basePath`** is applied automatically. Hand-building **`href={"/VISO/"}`** **doubles** the prefix → **`/VISO/VISO/…`** → **404** and confusion. **`not-found.tsx`** “Back home” uses **`href="/"`** only.
- **Trailing slash vs `admin.html`:** With **`output: "export"`**, the default layout writes **`out/admin.html`**. Browsers and the staff PWA manifest (**`start_url`:** **`./`**) open **`…/admin/`** (directory URL). GitHub Pages serves that only if **`out/admin/index.html`** exists. This repo enables **`trailingSlash: true`** in **`next.config.ts`** for **build/start** (static export) so **`out/admin/index.html`** is generated. The **Deploy to GitHub Pages** workflow uploads all of **`out/`** — a **404** on **`/VISO/admin/`** was not a “partial deploy,” it was the export shape.
- **Supabase Dashboard → Authentication → URL configuration:** Set **Site URL** to your real app root, e.g. **`https://cowebslb.github.io/VISO`** (with the project path). If it is **`https://cowebslb.github.io`** only, **password reset / magic links** can send users to the **user** Pages site instead of the bakery app.

## Order notifications (admin)

In **production** (service worker enabled), staff can turn on **order notifications** from the bar below the admin nav. The page asks for **Notification** permission. If **`NEXT_PUBLIC_VAPID_PUBLIC_KEY`** is set and Supabase push is configured, the device **registers Web Push** and **background** alerts are sent via an Edge Function when **`orders`** rows are inserted; otherwise the app **polls** **`orders`** every 45 seconds **only while the tab is open**. On **`/admin`** routes the **admin** worker (`public/admin/sw.js`, nested scope `…/admin/`) handles **`push`** events and **`SITE_SHOW_NOTIFICATION`** messages; the storefront uses Serwist (`src/app/sw.ts`). **`notificationclick`** focuses an open `/admin` tab or opens **Orders**. In **`next dev`**, service workers are disabled (`ClientProviders`), so a short notice is shown instead—use **`npm run build`** + **`npm run start`** to test notifications locally.

Step-by-step Supabase setup: [admin-push-notifications.md](./admin-push-notifications.md).

## Admin PWA (nested scope, same deploy)

- **Manifest:** **`public/admin/manifest.webmanifest`** (staff PWA; **`start_url`** / **`scope`** are **`./`** relative to `…/admin/`). **`id`** is **`pwa-staff`** (not **`./`**) so Chromium/Edge treat staff and storefront as **two apps**, not one “name update” from Bakery ↔ Staff. **`src/app/admin/layout.tsx`** sets **`metadata.manifest`** and staff **`appleWebApp`**. The storefront uses **`public/manifest.webmanifest`** with **`id`:** **`pwa-storefront`** — there is **no** root **`app/manifest.ts`**, because that route made Next’s metadata merge reapply the root manifest on admin pages during **`output: "export"`**, so the staff manifest link was wrong in prerendered HTML.
- **If the browser offers “Review name update” (Staff → Bakery or the reverse):** you previously had overlapping manifest identity (**`id`:** **`./`** on both). After deploy, **Uninstall** the bad shortcut, then **Add to Home Screen** again from **`/admin/...`** for staff and from **`/`** (or catalog) for the shop—or tap **Ignore** on the prompt if you want to keep the current name until you reinstall.
- **Service worker:** `public/admin/sw.js` — no Serwist precache (network by default); includes the same **push-style** **`message`** / **`notificationclick`** handlers as the main worker for staff notifications.
- **Registration:** `ClientProviders` registers **Serwist** only on **non-admin** routes; on **`/admin`** it calls **`navigator.serviceWorker.register(.../admin/sw.js, { scope: …/admin/ })`**. Unmounting the storefront Serwist wrapper clears **`window.serwist`** so switching between site and admin does not leave a stale singleton.

## Related

- [seed-admins.md](./seed-admins.md) — creating users and `admins` rows.
- [catalog-storage-and-staff.md](./catalog-storage-and-staff.md) — `getStaffSupabase()` and staff verification for data operations.
