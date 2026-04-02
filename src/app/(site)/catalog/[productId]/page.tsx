import { loadCatalogProducts } from "@/lib/catalog/load-catalog";
import { notFound } from "next/navigation";
import { ProductDetailsClient } from "./ProductDetailsClient";

type ProductDetailsPageProps = {
  params: Promise<{ productId: string }>;
};

export async function generateStaticParams() {
  const ids = await loadCatalogProducts().then((ps) => ps.map((p) => p.id));
  return ids.map((productId) => ({ productId }));
}

export default async function ProductDetailsPage({
  params,
}: ProductDetailsPageProps) {
  const { productId } = await params;
  const products = await loadCatalogProducts();
  const product = products.find((item) => item.id === productId);

  if (!product) {
    notFound();
  }

  return <ProductDetailsClient product={product} />;
}
