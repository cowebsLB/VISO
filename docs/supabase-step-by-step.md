# Supabase — what’s left (after day one)

## Background order push — mostly automated

From the **repo root**, with [Supabase CLI](https://supabase.com/docs/guides/cli) logged in and **`supabase link`** already pointing at your project:

```bash
npm install
npm run supabase:setup-order-push -- --site-url=https://YOUR_PUBLIC_SITE/VISO
```

Use your real **public** site URL (no trailing slash), e.g. GitHub Pages — same idea as `NEXT_PUBLIC_SITE_URL`. You can omit `--site-url` if **`NEXT_PUBLIC_SITE_URL`** is already set in **`.env.local`**.

The script will:

1. Generate **VAPID** keys and a **webhook secret**
2. **`supabase secrets set`** for the Edge Function
3. **`supabase db push`** (applies any pending migrations, including push subscriptions)
4. **`supabase functions deploy send-order-push`**

Then **you** do **one** thing in the browser: **Supabase Dashboard → Integrations → Webhooks** (not under Database — UI moved). Or open  
`https://supabase.com/dashboard/project/<YOUR_PROJECT_REF>/integrations/webhooks/overview`.  
Create a webhook on table **`orders`**, event **Insert**, URL **`https://<project-ref>.supabase.co/functions/v1/send-order-push`** (full path — the UI can clip; must end with **`send-order-push`**), method **POST**. Under **HTTP Headers**, add **`Authorization`** = **`Bearer <secret>`** and **`Content-type`** = **`application/json`**. Do **not** put `Authorization` under **HTTP Parameters** — that sends it as a query string (`?Authorization=…`), and the function returns **401** because it only reads the **`Authorization` header**.

Add **`NEXT_PUBLIC_VAPID_PUBLIC_KEY`** to **`.env.local`** (and GitHub Actions secret for Pages) using the line the script prints. Remove or protect **`supabase/.push-setup-secrets.env`** afterward (gitignored).

Optional flags: `--mailto=mailto:you@example.com` for VAPID subject.

Full detail: **[admin-push-notifications.md](./admin-push-notifications.md)**.

---

## If something else breaks

| Symptom | Doc |
|---------|-----|
| Staff / admin access | [seed-admins.md](./seed-admins.md) |
| Storage / image uploads | [catalog-storage-and-staff.md](./catalog-storage-and-staff.md) |
| Env / dev | [README.md](../README.md) |
