import { products } from "@/data/products";
import { notFound } from "next/navigation";
import { ProductDetailsClient } from "./ProductDetailsClient";

type ProductDetailsPageProps = {
  params: Promise<{ productId: string }>;
};

export function generateStaticParams() {
  return products.map((product) => ({ productId: product.id }));
}

export default async function ProductDetailsPage({
  params,
}: ProductDetailsPageProps) {
  const { productId } = await params;
  const product = products.find((item) => item.id === productId);

  if (!product) {
    notFound();
  }

  return <ProductDetailsClient product={product} />;
}
