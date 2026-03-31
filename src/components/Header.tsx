"use client";

import { useLocale } from "@/contexts/LocaleContext";
import { useCart } from "@/contexts/CartContext";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { publicAsset } from "@/lib/basePath";
import { LanguageSwitcher } from "./LanguageSwitcher";

const nav = [
  { href: "/", key: "home" as const },
  { href: "/catalog", key: "catalog" as const },
  { href: "/contact", key: "contact" as const },
];

function CartIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  );
}

export function Header() {
  const { messages } = useLocale();
  const { totalItems } = useCart();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const m = messages.nav;
  const brand = messages.brand;

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-50 border-b border-primary/10 bg-surface/85 backdrop-blur-md">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-primary-500 focus:px-4 focus:py-2 focus:text-white"
      >
        {m.skip}
      </a>
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-3 transition hover:opacity-90"
        >
          <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-2xl ring-2 ring-primary/20">
            <Image
              src={publicAsset("/Logo.png")}
              alt={brand.logoAlt}
              fill
              className="object-contain"
              sizes="48px"
              priority
            />
          </span>
          <span className="font-display text-xl font-bold text-primary-600">
            {brand.name}
          </span>
        </Link>

        <nav
          className="hidden flex-1 items-center justify-center gap-1 md:flex"
          aria-label="Main"
        >
          {nav.map(({ href, key }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  active
                    ? "bg-primary-500 text-white shadow-soft"
                    : "text-primary-700 hover:bg-primary-50"
                }`}
              >
                {m[key]}
              </Link>
            );
          })}
        </nav>

        <div className="ms-auto flex items-center gap-2 sm:gap-3">
          <div className="hidden md:block">
            <LanguageSwitcher />
          </div>
          <div className="md:hidden">
            <LanguageSwitcher />
          </div>
          <button
            type="button"
            className="rounded-xl border border-primary/20 bg-white p-2 text-primary-700 shadow-sm md:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((o) => !o)}
          >
            <span className="sr-only">
              {open ? m.closeMenu : m.openMenu}
            </span>
            <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden>
              {open ? (
                <path
                  fill="currentColor"
                  d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
                />
              ) : (
                <path fill="currentColor" d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
              )}
            </svg>
          </button>
          <Link
            href="/cart"
            aria-current={pathname === "/cart" ? "page" : undefined}
            className={`relative inline-flex shrink-0 items-center justify-center rounded-full p-2.5 shadow-sm transition hover:scale-[1.02] active:scale-[0.98] md:order-none md:gap-2 md:px-5 md:py-2.5 ${
              pathname === "/cart"
                ? "bg-primary-600 text-white ring-2 ring-primary-400/50"
                : "border border-primary/25 bg-primary-500 text-white hover:bg-primary-600"
            }`}
            title={m.cart}
          >
            <CartIcon className="md:shrink-0" />
            <span className="hidden max-w-[5rem] truncate text-sm font-semibold md:inline">
              {m.cart}
            </span>
            {totalItems > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-white px-1 text-xs font-bold text-primary-600 ring-2 ring-primary-500 md:static md:ms-0 md:ring-0">
                {totalItems > 99 ? "99+" : totalItems}
              </span>
            )}
          </Link>
        </div>
      </div>

      {open && (
        <div
          id="mobile-nav"
          className="border-t border-primary/10 bg-surface/95 px-4 py-4 md:hidden"
        >
          <div className="flex flex-col gap-2">
            {nav.map(({ href, key }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className={`rounded-xl px-4 py-3 text-center font-semibold ${
                    active
                      ? "bg-primary-500 text-white"
                      : "bg-white text-primary-700 shadow-sm"
                  }`}
                >
                  {m[key]}
                </Link>
              );
            })}
            <Link
              href="/cart"
              onClick={() => setOpen(false)}
              className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 font-semibold ${
                pathname === "/cart"
                  ? "bg-primary-600 text-white"
                  : "bg-primary-500 text-white shadow-sm"
              }`}
            >
              <CartIcon className="shrink-0" />
              {m.cart}
              {totalItems > 0 && (
                <span className="rounded-full bg-white/25 px-2 py-0.5 text-sm">
                  {totalItems}
                </span>
              )}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
