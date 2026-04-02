import { loadCatalogProducts } from "@/lib/catalog/load-catalog";
import { CatalogPageClient } from "./CatalogPageClient";

export default async function CatalogPage() {
  const products = await loadCatalogProducts();
  return <CatalogPageClient products={products} />;
}
