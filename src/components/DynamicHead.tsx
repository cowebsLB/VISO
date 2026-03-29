"use client";

import { useLocale } from "@/contexts/LocaleContext";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

export function DynamicHead() {
  const { locale, messages } = useLocale();
  const pathname = usePathname();

  useEffect(() => {
    const meta = messages.meta;
    let title = meta.home.title;
    let desc = meta.home.description;
    if (pathname.startsWith("/catalog")) {
      title = meta.catalog.title;
      desc = meta.catalog.description;
    } else if (pathname.startsWith("/cart")) {
      title = meta.cart.title;
      desc = meta.cart.description;
    } else if (pathname.startsWith("/checkout")) {
      title = meta.checkout.title;
      desc = meta.checkout.description;
    } else if (pathname.startsWith("/contact")) {
      title = meta.contact.title;
      desc = meta.contact.description;
    }
    document.title = title;
    const el = document.querySelector('meta[name="description"]');
    if (el) el.setAttribute("content", desc);
  }, [locale, pathname, messages]);

  return null;
}
