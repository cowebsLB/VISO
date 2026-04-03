# Anush Badar — documentation

Technical reference for the **Anush Badar** bakery site: Next.js storefront, Supabase backend, staff admin, and local development.

## Start here

| Doc | What it covers |
|-----|----------------|
| [README.md](../README.md) (repo root) | Install, env vars, scripts, troubleshooting for dev/build |
| [seed-admins.md](./seed-admins.md) | Creating Auth users, `public.admins` rows, staff access |
| [catalog-storage-and-staff.md](./catalog-storage-and-staff.md) | Live catalog fetch, product images, Storage, RLS / staff checks |

## Admin UI (staff)

| Doc | What it covers |
|-----|----------------|
| [admin-auth-and-login.md](./admin-auth-and-login.md) | `/admin/login`, username vs Gmail, redirects, sign-out, `AdminAuthGate`, optional order notifications (SW) |
| [admin-inventory.md](./admin-inventory.md) | Ingredients list, add/edit/update stock/remove, `adjust_inventory` RPC |
| [admin-recipes-bom.md](./admin-recipes-bom.md) | Bill of materials UI, grouping, add/edit/remove lines, variant vs fallback rules |

## Development and operations

| Doc | What it covers |
|-----|----------------|
| [dev-environment-windows.md](./dev-environment-windows.md) | Webpack vs Turbopack, `.next` cache, `npm run clean`, Next devtools flag |

## Project history

| Doc | What it covers |
|-----|----------------|
| [implementation-chronicle.md](./implementation-chronicle.md) | Long-form timeline of major phases, errors, and fixes |
| [Worklog-02-04-2026.md](./Worklog-02-04-2026.md) | Daily worklog: admin inventory, auth, recipes, docs restructure (2 Apr 2026) |
| [Worklog-03-04-2026.md](./Worklog-03-04-2026.md) | Daily worklog: Anush Badar branding, PWA/dev cache, staff notifs, orders cards (3 Apr 2026) |

## Database and migrations

- SQL migrations live under **`supabase/migrations/`** (core schema, RLS, RPCs, seed catalog, storage policies).
- Operational notes for staff and RLS are duplicated in context in **catalog-storage-and-staff.md** and **admin-** docs where relevant.

## Conventions

- **Secrets:** Never commit service role keys or passwords. Anon key in `NEXT_PUBLIC_*` is expected for the browser; RLS enforces access.
- **Staff:** A user must exist in **`auth.users`** and have a matching row in **`public.admins`** (`user_id` = Auth UUID).
