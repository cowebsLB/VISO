"use client";

import { useLocale } from "@/contexts/LocaleContext";
import { products } from "@/data/products";
import { publicAsset } from "@/lib/basePath";
import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
  const { locale, messages } = useLocale();
  const h = messages.home;
  const brand = messages.brand;
  const featured = products.slice(0, 3);

  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-b from-surface to-primary-50/30 px-4 py-16 sm:px-6 md:py-24 lg:px-8">
        <div className="animate-float-soft pointer-events-none absolute -right-20 top-10 h-64 w-64 rounded-full bg-primary-200/30 blur-3xl" />
        <div className="relative mx-auto max-w-6xl">
          <div className="grid items-center gap-10 md:grid-cols-2">
            <div className="animate-fade-up space-y-6">
              <h1 className="font-display text-4xl font-bold leading-tight text-primary-600 md:text-5xl">
                {h.heroTitle}
              </h1>
              <p className="max-w-prose text-lg text-slate-700">{h.heroSubtitle}</p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/catalog"
                  className="inline-flex items-center justify-center rounded-full bg-primary-500 px-8 py-3 text-base font-semibold text-white shadow-soft transition hover:scale-[1.02] hover:bg-primary-600 active:scale-[0.98]"
                >
                  {h.ctaCatalog}
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center rounded-full border-2 border-primary-400 bg-white/80 px-8 py-3 text-base font-semibold text-primary-700 transition hover:bg-primary-50"
                >
                  {h.ctaContact}
                </Link>
              </div>
            </div>
            <div className="animate-fade-in relative mx-auto aspect-square w-full max-w-sm">
              <div className="absolute inset-0 rounded-3xl bg-white shadow-card ring-1 ring-primary/10" />
              <div className="relative h-full w-full p-6">
                <Image
                  src={publicAsset("/Logo.png")}
                  alt={brand.logoAlt}
                  fill
                  className="rounded-2xl object-contain p-4"
                  sizes="(max-width: 768px) 100vw, 400px"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 md:items-center">
          <div className="animate-fade-up">
            <h2 className="font-display text-3xl font-bold text-primary-600">
              {h.aboutTitle}
            </h2>
            <p className="mt-4 text-slate-700 leading-relaxed">{h.aboutBody}</p>
          </div>
          <div className="animate-fade-up rounded-3xl bg-white p-8 shadow-card ring-1 ring-primary/10 delay-100">
            <p className="text-sm font-medium uppercase tracking-wide text-primary-500">
              {brand.name}
            </p>
            <p className="mt-2 text-slate-600">{h.heroSubtitle}</p>
          </div>
        </div>
      </section>

      <section className="bg-white/50 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-display text-center text-3xl font-bold text-primary-600">
            {h.featuredTitle}
          </h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((p, i) => (
              <article
                key={p.id}
                className="animate-fade-up group flex flex-col overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-primary/10 transition hover:-translate-y-1 hover:shadow-lg"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="relative aspect-[4/3] bg-surface">
                  <Image
                    src={publicAsset(p.image)}
                    alt=""
                    fill
                    className="object-cover transition duration-300 group-hover:scale-[1.03]"
                    sizes="(max-width: 640px) 100vw, 33vw"
                  />
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="font-display text-lg font-semibold text-primary-700">
                    {p.names[locale]}
                  </h3>
                  <p className="mt-2 line-clamp-2 flex-1 text-sm text-slate-600">
                    {p.descriptions[locale]}
                  </p>
                  <Link
                    href="/catalog"
                    className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary-600 hover:underline"
                  >
                    {h.featuredCta}
                    <span aria-hidden>→</span>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <ul className="grid gap-6 md:grid-cols-3">
          <li className="flex flex-col items-center rounded-2xl bg-primary-50/80 p-6 text-center ring-1 ring-primary/15">
            <span className="text-3xl" aria-hidden>
              🥖
            </span>
            <p className="mt-3 font-semibold text-primary-800">{h.trustFresh}</p>
          </li>
          <li className="flex flex-col items-center rounded-2xl bg-primary-50/80 p-6 text-center ring-1 ring-primary/15">
            <span className="text-3xl" aria-hidden>
              📍
            </span>
            <p className="mt-3 font-semibold text-primary-800">{h.trustPickup}</p>
          </li>
          <li className="flex flex-col items-center rounded-2xl bg-primary-50/80 p-6 text-center ring-1 ring-primary/15">
            <span className="text-3xl" aria-hidden>
              💌
            </span>
            <p className="mt-3 font-semibold text-primary-800">{h.trustCustom}</p>
          </li>
        </ul>
      </section>
    </>
  );
}
