# Admin recipes (bill of materials)

Route: **`/admin/recipes`**. Manages **`public.recipe_lines`**: how much of each **ingredient** is consumed **per 1 kg of finished product** for a given **product** and optional **variant** (`product_option_id`).

## Access

- Loads and mutates through **`getStaffSupabase()`** (staff-only via RLS policy **`recipe_lines_admin_all`**).

## Display (readability)

- Data is **grouped by product**, then **by variant** (or by “shared” rows with `product_option_id` null).
- **English** display names come from **`product_i18n`** and **`product_option_i18n`** with locale **`en`**, with **`product_id` / `option_id`** slugs shown as secondary text.
- **Ingredients** show name and track unit (`kg` / `L`).
- Amounts are formatted with a reasonable number of decimal places (not always four).

## Add / edit / remove

| Action | Behavior |
|--------|----------|
| **Add ingredient** | Modal: product (all rows from **`products`**), variant (options from **`product_options`** for that product, or “fallback” row — see below), ingredient from **`ingredients`**, amount per 1 kg finished product (> 0). |
| **Edit** | Same fields; updates the row by **`id`**. |
| **Remove** | Deletes the **`recipe_lines`** row after confirmation. |

- **Default when adding:** If the product has variants, the first option (by **`sort_order`**, then id) is pre-selected instead of the fallback, to match common seed data where each variant has its own BOM.
- **Unique constraint:** `(product_id, product_option_id, ingredient_id)` with **`NULLS NOT DISTINCT`**. Duplicate combinations surface a friendly UI error (`recipe_lines_unique_bom` / duplicate key text).

## Variant-specific vs shared lines (order fulfillment)

Logic lives in **`private.apply_order_to_inventory`** (`supabase/migrations/20260204120002_functions.sql`):

1. For each order line with a **non-null** `option_id`, the function checks whether **any** `recipe_lines` row exists for that **`product_id`** and the **same** `product_option_id` (**`IS NOT DISTINCT FROM`**).
2. **If yes:** only those variant-specific lines are used for consumption.
3. **If no:** lines where **`product_option_id IS NULL`** are used (“shared” / fallback for any variant that has no dedicated BOM).

Implications for staff:

- If every variant should consume ingredients differently, add **per-variant** lines.
- **Shared** rows are for products where one BOM applies whenever no variant-specific recipe exists, or for products **without** options in **`product_options`**.

## Related

- [admin-inventory.md](./admin-inventory.md) — ingredients referenced by BOM rows.
- Core schema: `recipe_lines` FK to `products`, `product_options`, `ingredients`.
