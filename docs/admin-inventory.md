# Admin inventory (ingredients)

Route: **`/admin/inventory`**. Manages **`public.ingredients`** and stock changes via **`adjust_inventory`** so **`inventory_transactions`** stay consistent.

## Access

- Uses **`getStaffSupabase()`** from `src/lib/admin/staff-access.ts` (same pattern as orders and recipes). If the session is missing or the user has no **`admins`** row, a clear message is shown instead of empty data.

## Features

| Action | Behavior |
|--------|----------|
| **Add ingredient** | Modal: name, optional category, unit (`kg` / `L`), starting `quantity_on_hand`, cost per unit, optional low-stock threshold. Inserts into `ingredients`. |
| **Edit** | Updates name, category, unit, cost, low threshold. **On-hand quantity is read-only** here; staff must use **Update stock**. |
| **Update stock** | Modal: stock in/out, positive amount, reason (mapped to `purchase` / `waste` / `correction` / `adjustment`), optional notes. Calls **`adjust_inventory`** RPC. |
| **Remove** | Deletes row if not referenced by **`recipe_lines`** (FK). On failure, message hints to remove from **Recipes** first. |

## Implementation notes

- Mutations go through a local **`withStaff`** helper that returns **`"ok" | "staff" | "fail"`** and centralizes error handling (including FK hints on delete).
- **`SupabaseClient`** typing avoids fragile `infer` types on the client returned from `getStaffSupabase()`.

## Related

- Recipe lines reference ingredients; see [admin-recipes-bom.md](./admin-recipes-bom.md).
- RPC and RLS definitions: `supabase/migrations/` (e.g. `adjust_inventory`, `ingredients` policies).
