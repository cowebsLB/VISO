"use client";

import { useLocale } from "@/contexts/LocaleContext";
import {
  categoryKeys,
  type CategoryFilter,
  type ProductCategory,
  productStartingPrice,
  type Product,
} from "@/data/products";
import { publicAsset } from "@/lib/basePath";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

const filterToCategory: Record<CategoryFilter, ProductCategory | null> = {
  all: null,
  cakes: "cakes",
  cookies: "cookies",
  bread: "bread",
};

export function CatalogPageClient({ products }: { products: Product[] }) {
  const { locale, messages } = useLocale();
  const c = messages.catalog;
  const [filter, setFilter] = useState<CategoryFilter>("all");

  const filtered = useMemo(() => {
    const cat = filterToCategory[filter];
    if (!cat) return products;
    return products.filter((p) => p.category === cat);
  }, [filter, products]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="animate-fade-up text-center md:text-start">
        <h1 className="font-display text-4xl font-bold text-primary-600">
          {c.title}
        </h1>
        <p className="mt-3 max-w-2xl text-slate-600">{c.subtitle}</p>
      </header>

      <div className="mt-8 flex flex-wrap justify-center gap-2 md:justify-start">
        {categoryKeys.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              filter === key
                ? "bg-primary-500 text-white shadow-soft"
                : "bg-white text-primary-700 ring-1 ring-primary/15 hover:bg-primary-50"
            }`}
          >
            {key === "all" && c.filterAll}
            {key === "cakes" && c.filterCakes}
            {key === "cookies" && c.filterCookies}
            {key === "bread" && c.filterBread}
          </button>
        ))}
      </div>

      <ul className="mt-12 grid list-none gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((p) => {
          return (
            <li
              key={p.id}
              className="animate-fade-up flex flex-col overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-primary/10 transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="relative aspect-[4/3] bg-surface">
                <Image
                  src={publicAsset(p.image)}
                  alt={p.names[locale]}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, 33vw"
                />
              </div>
              <div className="flex flex-1 flex-col p-5">
                <h2 className="font-display text-lg font-semibold text-primary-800">
                  {p.names[locale]}
                </h2>
                <p className="mt-2 line-clamp-2 flex-1 text-sm text-slate-600">
                  {p.descriptions[locale]}
                </p>
                <p className="mt-3 font-semibold text-primary-600">
                  {c.fromPrice}: ${productStartingPrice(p).toFixed(2)}
                </p>
                <Link
                  href={`/catalog/${p.id}`}
                  className="mt-4 block w-full rounded-xl bg-primary-500 py-3 text-center text-sm font-semibold text-white shadow-soft transition hover:bg-primary-600 active:scale-[0.98]"
                >
                  {c.viewDetails}
                </Link>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
