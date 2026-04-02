import type { SupabaseClient } from "@supabase/supabase-js";
import type { LocaleCode } from "@/lib/locale";
import type { Product, ProductOption } from "@/data/products";

/** Category slug for storefront filters; default keeps legacy “bread” bucket when uncategorized. */
export function categorySlugFromDb(slug: string | null | undefined): string {
  const s = slug?.trim();
  return s && s.length > 0 ? s : "bread";
}

function rowToLocalized(
  rows: { locale: string; name: string; description: string | null }[],
): Record<LocaleCode, string> {
  const en = rows.find((r) => r.locale === "en");
  const ar = rows.find((r) => r.locale === "ar");
  const hy = rows.find((r) => r.locale === "hy");
  return {
    en: en?.name ?? "",
    ar: ar?.name ?? en?.name ?? "",
    hy: hy?.name ?? en?.name ?? "",
  };
}

function rowToDescLocalized(
  rows: { locale: string; name: string; description: string | null }[],
): Record<LocaleCode, string> {
  const en = rows.find((r) => r.locale === "en");
  const ar = rows.find((r) => r.locale === "ar");
  const hy = rows.find((r) => r.locale === "hy");
  return {
    en: en?.description ?? "",
    ar: ar?.description ?? en?.description ?? "",
    hy: hy?.description ?? en?.description ?? "",
  };
}

/**
 * Loads active catalog rows from Supabase (anon/staff client).
 * Returns `null` if the products query fails or returns no rows (caller may fall back to static data).
 */
export async function fetchCatalogProductsFromSupabase(
  supabase: SupabaseClient,
): Promise<Product[] | null> {
  const { data: prows, error: pErr } = await supabase
    .from("products")
    .select("id, category_id, image_path, weight_per_sale_unit_kg")
    .eq("is_active", true);

  if (pErr || !prows?.length) {
    return null;
  }

  const productIds = prows.map((p) => p.id);

  const [{ data: cats }, { data: opts }, { data: pi18n }, { data: oi18n }] =
    await Promise.all([
      supabase.from("product_categories").select("id, slug"),
      supabase
        .from("product_options")
        .select("product_id, id, sort_order, unit_price, weight_per_sale_unit_kg")
        .in("product_id", productIds)
        .order("sort_order"),
      supabase.from("product_i18n").select("product_id, locale, name, description").in("product_id", productIds),
      supabase
        .from("product_option_i18n")
        .select("product_id, option_id, locale, name, description")
        .in("product_id", productIds),
    ]);

  const catById = new Map((cats ?? []).map((c) => [c.id, c.slug as string]));
  const optsByProduct = new Map<string, typeof opts>();
  for (const o of opts ?? []) {
    const list = optsByProduct.get(o.product_id) ?? [];
    list.push(o);
    optsByProduct.set(o.product_id, list);
  }

  const piByProduct = new Map<string, typeof pi18n>();
  for (const row of pi18n ?? []) {
    const list = piByProduct.get(row.product_id) ?? [];
    list.push(row);
    piByProduct.set(row.product_id, list);
  }

  const oiKey = (pid: string, oid: string) => `${pid}\0${oid}`;
  const oiByKey = new Map<string, typeof oi18n>();
  for (const row of oi18n ?? []) {
    const list = oiByKey.get(oiKey(row.product_id, row.option_id)) ?? [];
    list.push(row);
    oiByKey.set(oiKey(row.product_id, row.option_id), list);
  }

  const out: Product[] = [];

  for (const p of prows) {
    const slug = p.category_id ? (catById.get(p.category_id) ?? null) : null;
    const category = categorySlugFromDb(slug);
    const pRows = piByProduct.get(p.id) ?? [];
    const names = rowToLocalized(pRows);
    const descriptions = rowToDescLocalized(pRows);
    const rawOpts = (optsByProduct.get(p.id) ?? []).slice().sort((a, b) => a.sort_order - b.sort_order);
    const options: ProductOption[] = rawOpts.map((o) => {
      const optRows = oiByKey.get(oiKey(p.id, o.id)) ?? [];
      return {
        id: o.id,
        price: Number(o.unit_price),
        names: rowToLocalized(optRows),
        descriptions: rowToDescLocalized(optRows),
      };
    });

    const basePrice =
      options.length > 0 ? Math.min(...options.map((x) => x.price)) : 0;

    out.push({
      id: p.id,
      category,
      price: basePrice,
      image: p.image_path ?? "/images/products/plain-kaak.webp",
      names,
      descriptions,
      options,
    });
  }

  out.sort((a, b) => a.id.localeCompare(b.id));
  return out;
}
