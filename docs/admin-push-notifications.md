# Admin order notifications — Web Push (Supabase)

This adds **background** order alerts for the installed admin PWA. When a row is inserted into **`public.orders`**, a **Database Webhook** calls a **Supabase Edge Function** that sends **Web Push** to every subscription in **`public.admin_push_subscriptions`**.

If **`NEXT_PUBLIC_VAPID_PUBLIC_KEY`** is not set in the app build, staff still get **in-tab polling** only (same as before).

## What you will do (checklist)

1. Apply the new migration (`admin_push_subscriptions`).
2. Generate **VAPID** keys and add secrets to Supabase + one public key to the Next.js env.
3. Deploy the Edge Function **`send-order-push`**.
4. Create a **Database Webhook** on **`orders` → INSERT** that POSTs to the function with a **Bearer** secret.
5. Redeploy the site (GitHub Pages / hosting) with **`NEXT_PUBLIC_VAPID_PUBLIC_KEY`**.
6. On a **production** build, open **Admin → Enable notifications** so the browser subscribes and saves the row in Supabase.

---

## Step 1 — Run the migration

Locally (with Supabase CLI linked to your project):

```bash
supabase db push
```

Or paste the SQL from **`supabase/migrations/20260205120000_admin_push_subscriptions.sql`** into **Supabase Dashboard → SQL → New query** and run it.

---

## Step 2 — Generate VAPID keys

VAPID identifies your app to browser push services. You need one key pair.

**Option A — Node (if you have `web-push` installed globally or use npx):**

```bash
npx web-push generate-vapid-keys
```

**Option B — OpenSSL + manual** (if you prefer): follow [Mozilla’s VAPID guide](https://blog.mozilla.org/services/2016/08/23/sending-vapid-identified-webpush-notifications-via-mozillas-push-service/).

You get:

- **Public key** — safe in the browser → **`NEXT_PUBLIC_VAPID_PUBLIC_KEY`** (also stored as an Edge secret for the `web-push` library).
- **Private key** — **Edge Function secrets only**, never in Next.js or GitHub Pages.

Also pick a **contact** string for VAPID (required by the spec), e.g. **`mailto:you@yourdomain.com`** (can be your real email).

---

## Step 3 — Supabase Edge Function secrets

In **Supabase Dashboard → Project Settings → Edge Functions → Secrets** (or **CLI**: `supabase secrets set ...`), add:

| Name | Value |
|------|--------|
| `VAPID_PUBLIC_KEY` | Same string as `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (no quotes) |
| `VAPID_PRIVATE_KEY` | Private key from step 2 |
| `VAPID_SUBJECT` | e.g. `mailto:you@yourdomain.com` |
| `ORDER_PUSH_WEBHOOK_SECRET` | Long random string (generate in password manager) |
| `ORDER_PUSH_SITE_URL` | **Public site base** with no trailing slash, e.g. `https://cowebslb.github.io/VISO` — used so notification clicks open the correct **Orders** URL |
| `ORDER_NOTIFICATION_BRAND` | Optional; default `New order`. Shown in the notification title |

**Note:** `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are provided automatically to Edge Functions; do not paste the service role into the frontend.

---

## Step 4 — Deploy the Edge Function

From the repo root (with CLI logged in: `supabase link`):

```bash
supabase functions deploy send-order-push
```

After deploy, the function URL is:

`https://<PROJECT_REF>.supabase.co/functions/v1/send-order-push`

---

## Step 5 — Database Webhook

1. Open **Supabase Dashboard → Integrations → Webhooks** (primary location in current UI). If you still see **Database → Database Webhooks** on an older layout, that works too. Direct link pattern: `https://supabase.com/dashboard/project/<PROJECT_REF>/integrations/webhooks/overview`.
2. **Create a new webhook**:
   - **Table:** `orders`
   - **Events:** **Insert** only
   - **Type:** Supabase Edge Functions **or** HTTP Request  
     - If HTTP: URL = `https://<PROJECT_REF>.supabase.co/functions/v1/send-order-push`
   - **HTTP Headers:** add  
     `Authorization` = `Bearer <ORDER_PUSH_WEBHOOK_SECRET>`  
     (use the **exact** same secret as in Edge secrets).
3. Save.

If the dashboard offers “invoke Edge Function” with built-in auth, prefer that only if it sends the same Bearer token your function expects; otherwise use HTTP POST with the header above.

The function returns **401** if the Bearer token does not match **`ORDER_PUSH_WEBHOOK_SECRET`**.

---

## Step 6 — Frontend env (local + production)

Add to **`.env.local`** and to **GitHub Actions secrets** for Pages (see `.github/workflows/deploy-pages.yml`):

```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<your VAPID public key>
```

Redeploy the static site after changing secrets.

---

## Step 7 — Test on staff devices

1. Deploy **production** build (service workers are not used the same way in `next dev`).
2. Sign in to **Admin**, tap **Enable** / **Turn on** for order notifications.
3. You should see **“On · background push (works when app is closed)”** when registration succeeds.
4. Place a **test order** (checkout). Within a few seconds, subscribed devices should get a push even if the admin PWA is in the background or closed (OS/browser dependent).

**iOS:** Web Push for installed PWAs has extra requirements (iOS 16.4+, added to Home Screen). Use Safari and the admin PWA from the home screen.

---

## Troubleshooting

| Symptom | What to check |
|--------|----------------|
| Cannot find Webhooks in Dashboard | Use **Integrations → Webhooks**, not **Database** (Studio UI). |
| 404 from function | Webhook URL must end **`/functions/v1/send-order-push`** (full name; easy to truncate in the form). |
| 401 from function | Webhook **Authorization** header must be `Bearer ` + same value as `ORDER_PUSH_WEBHOOK_SECRET`. |
| No notification, function 200 | No rows in **`admin_push_subscriptions`** — enable notifications in admin on a **production** URL with VAPID set. |
| Push shows but wrong link | Set **`ORDER_PUSH_SITE_URL`** to your real public origin + base path (e.g. GitHub Pages `/VISO`). |
| “Push not active” in UI | Open browser devtools → Network/Console; often RLS or missing migration. Confirm your user is in **`public.admins`**. |
| Stale subscriptions | The function removes subscriptions that return **410/404** from the push service. |

---

## Related code

| Piece | Location |
|-------|-----------|
| Subscription table + RLS | `supabase/migrations/20260205120000_admin_push_subscriptions.sql` |
| Edge Function | `supabase/functions/send-order-push/index.ts` |
| `verify_jwt = false` | `supabase/config.toml` → `[functions.send-order-push]` |
| Subscribe + Supabase upsert | `src/lib/push/admin-web-push.ts` |
| Admin UI | `src/components/admin/StaffOrderNotifications.tsx` |
| Push + click handlers | `public/admin/sw.js` |

---

## Security notes

- Only **authenticated staff** (`public.is_admin()`) can insert/update/delete their own push rows (RLS).
- The **webhook** must stay secret; anyone with the URL and secret could trigger pushes (with empty or spoof payloads still bounded by your function logic). Rotate **`ORDER_PUSH_WEBHOOK_SECRET`** if it leaks.
- Never commit **`VAPID_PRIVATE_KEY`** or **`ORDER_PUSH_WEBHOOK_SECRET`** to the repo.
