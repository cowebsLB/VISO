# Seeding four staff admin accounts

The `admins` table links Supabase Auth users to staff UI access. Passwords must **never** be committed to the repo.

## How login works (username or full email)

On **`/admin/login`**, the first field is **“Email or username”**.

1. **Synthetic staff accounts (recommended for simple setups):**  
   In the Dashboard, create users with email **`something@viso-admin.local`**. On the site, staff type only **`something`** (no `@`); the app signs in as **`something@viso-admin.local`**.

2. **Real email addresses (e.g. Gmail):**  
   If you create the user with **`person@gmail.com`** in **Authentication → Users**, staff must type that **full address** in the login field (the app detects `@` and does not rewrite the domain).

Passwords are never stored in the repo. See **[admin-auth-and-login.md](./admin-auth-and-login.md)** for redirects, sign-out behavior, and edge cases.

## 1. Create Auth users (Dashboard)

1. **Authentication** → **Users** → **Add user** → **Create new user**.
2. For each person, set:
   - **Email** (required by Supabase). Either:
     - **`username@viso-admin.local`** (e.g. `christian@viso-admin.local`, …) so they can sign in with the short **username** on the site, **or**
     - A **real address** (e.g. Gmail); they must sign in with that **full email** on the site.
   - **Password** (set securely; not in git).
   - **Auto Confirm User** so they can sign in immediately.
3. Enable **Email** provider under **Authentication** → **Providers** (no Google/OAuth needed for staff in v1).

For **`@viso-admin.local`** accounts only, staff can sign in with the **first part** (e.g. `christian`) instead of the full email.

## 2. Insert `admins` rows

After each `auth.users` row exists, copy its **UUID** (`id`). In **SQL Editor**:

```sql
INSERT INTO public.admins (user_id, display_name)
VALUES
  ('<uuid-christian>', 'christian'),
  ('<uuid-rita>', 'rita'),
  ('<uuid-vicky>', 'vicky'),
  ('<uuid-sonig>', 'sonig');
```

`display_name` can match the username; it is shown in the UI.

## 3. Sign in on the site

Open `/admin/login`, enter **username** + **password** (e.g. `christian`, not an email address).

## 4. CI / E2E (optional)

For automated tests, use a dedicated test project or test users and GitHub **secrets** — never log passwords.

## Troubleshooting

| Message or symptom | What to check |
|--------------------|----------------|
| **“Your account is not linked as staff”** but you see a row in `public.admins` | Ensure `admins.user_id` exactly matches **Authentication → Users →** that user’s **UUID** (not email). Ensure the site’s `NEXT_PUBLIC_SUPABASE_*` env vars are for the **same** project. Use a current app build: staff checks query `.eq("user_id", session.user.id)` so RLS returning multiple admin rows does not break verification. |
| **“Could not verify staff”** with a PostgREST error | Network/CORS, wrong anon key, or RLS/policy drift; compare local env to Dashboard **Settings → API**. |
| Admin pages load but **orders/menu are empty** | Often `is_admin()` false: missing or wrong `admins` row, or signed in as a different Auth user than the one in `admins`. |
