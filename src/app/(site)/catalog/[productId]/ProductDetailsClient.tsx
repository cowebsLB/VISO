"use client";

import { useCart } from "@/contexts/CartContext";
import { useLocale } from "@/contexts/LocaleContext";
import type { Product } from "@/data/products";
import { fetchCatalogProductsFromSupabase } from "@/lib/catalog/supabase-catalog";
import { productImageUrl } from "@/lib/images/product-image-url";
import { createSupabaseAnonClient, hasSupabaseEnv } from "@/lib/supabase/client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type ProductDetailsClientProps = {
  product: Product;
};

export function ProductDetailsClient({ product: initialProduct }: ProductDetailsClientProps) {
  const { locale, messages } = useLocale();
  const { addLine, lines } = useCart();
  const c = messages.catalog;

  const [product, setProduct] = useState(initialProduct);

  useEffect(() => {
    setProduct(initialProduct);
  }, [initialProduct]);

  useEffect(() => {
    if (!hasSupabaseEnv()) return;
    let cancelled = false;
    void (async () => {
      try {
        const supabase = createSupabaseAnonClient();
        const list = await fetchCatalogProductsFromSupabase(supabase);
        if (cancelled || !list?.length) return;
        const fresh = list.find((p) => p.id === initialProduct.id);
        if (fresh) setProduct(fresh);
      } catch {
        /* keep build-time product */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [initialProduct.id]);

  const [selectedOptionId, setSelectedOptionId] = useState(
    () => initialProduct.options[0]?.id ?? "",
  );

  useEffect(() => {
    const first = product.options[0]?.id ?? "";
    setSelectedOptionId((prev) =>
      product.options.some((o) => o.id === prev) ? prev : first,
    );
  }, [product]);

  const selectedOption = useMemo(
    () =>
      product.options.find((option) => option.id === selectedOptionId) ??
      product.options[0],
    [product.options, selectedOptionId],
  );

  const inCart = useMemo(() => {
    if (!selectedOption) return 0;
    const cartLineId = `${product.id}:${selectedOption.id}`;
    const line = lines.find((item) => item.productId === cartLineId);
    return line?.qty ?? 0;
  }, [lines, product.id, selectedOption]);

  if (!selectedOption) return null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <Link
        href="/catalog"
        className="inline-flex rounded-full border border-primary/20 bg-white px-4 py-2 text-sm font-semibold text-primary-700 shadow-sm transition hover:bg-primary-50"
      >
        {c.backToMenu}
      </Link>

      <div className="mt-6 grid gap-8 rounded-2xl bg-white p-5 shadow-card ring-1 ring-primary/10 md:grid-cols-2 md:p-8">
        <div className="relative aspect-square overflow-hidden rounded-2xl bg-surface">
          <Image
            src={productImageUrl(product.image)}
            alt={product.names[locale]}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 45vw"
          />
        </div>

        <div>
          <h1 className="font-display text-3xl font-bold text-primary-700">
            {product.names[locale]}
          </h1>
          <p className="mt-3 text-slate-600">{product.descriptions[locale]}</p>

          <h2 className="mt-6 text-sm font-semibold uppercase tracking-wide text-primary-500">
            {c.availableOptions}
          </h2>

          <div className="mt-3 space-y-2">
            {product.options.map((option) => {
              const selected = option.id === selectedOption.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setSelectedOptionId(option.id)}
                  className={`w-full rounded-xl px-4 py-3 text-left transition ${
                    selected
                      ? "bg-primary-500 text-white shadow-soft"
                      : "bg-white text-primary-800 ring-1 ring-primary/15 hover:bg-primary-50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold">{option.names[locale]}</span>
                    <span className="font-semibold">
                      ${option.price.toFixed(2)}
                    </span>
                  </div>
                  <p
                    className={`mt-1 text-sm ${selected ? "text-white/90" : "text-slate-600"}`}
                  >
                    {option.descriptions[locale]}
                  </p>
                </button>
              );
            })}
          </div>

          <div className="mt-6 rounded-2xl bg-primary-50 p-4 ring-1 ring-primary/15">
            <p className="text-sm text-primary-700">{c.selectedOption}</p>
            <p className="mt-1 font-semibold text-primary-800">
              {selectedOption.names[locale]}
            </p>
            <p className="mt-1 text-lg font-bold text-primary-700">
              ${selectedOption.price.toFixed(2)}
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              addLine({
                productId: `${product.id}:${selectedOption.id}`,
                title: `${product.names[locale]} - ${selectedOption.names[locale]}`,
                unitPrice: selectedOption.price,
                qty: 1,
                image: product.image,
              })
            }
            className="mt-6 w-full rounded-xl bg-primary-500 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-primary-600 active:scale-[0.98]"
          >
            {inCart > 0 ? `${c.addToCart} (${inCart})` : c.addToCart}
          </button>
        </div>
      </div>
    </div>
  );
}
