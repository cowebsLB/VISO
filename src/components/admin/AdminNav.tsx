"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/recipes", label: "Recipes" },
  { href: "/admin/inventory", label: "Inventory" },
] as const;

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav
      className="flex flex-wrap gap-2 border-b border-slate-200 bg-white px-4 py-3"
      aria-label="Admin"
    >
      {links.map(({ href, label }) => {
        const active = pathname === href || (href !== "/admin" && pathname?.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              active
                ? "bg-primary-600 text-white"
                : "bg-slate-100 text-slate-800 hover:bg-slate-200"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
