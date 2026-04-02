import { products as staticProducts } from "@/data/products";
import { fetchCatalogProductsFromSupabase } from "@/lib/catalog/supabase-catalog";
import type { Product } from "@/data/products";
import { createSupabaseAnonServerClient, hasSupabaseBuildEnv } from "@/lib/supabase/server";

/**
 * Loads active catalog from Supabase when build env is set; otherwise returns static `products`.
 */
export async function loadCatalogProducts(): Promise<Product[]> {
  if (!hasSupabaseBuildEnv()) {
    return staticProducts;
  }

  try {
    const supabase = createSupabaseAnonServerClient();
    const out = await fetchCatalogProductsFromSupabase(supabase);
    if (!out?.length) {
      console.warn("[catalog] Supabase products fetch empty or failed, using static data");
      return staticProducts;
    }
    return out;
  } catch (e) {
    console.warn("[catalog] Supabase load error, using static data:", e);
    return staticProducts;
  }
}

export async function loadCatalogProductIds(): Promise<string[]> {
  const list = await loadCatalogProducts();
  return list.map((p) => p.id);
}
