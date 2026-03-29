"use client";

import { CartProvider } from "@/contexts/CartContext";
import { LocaleProvider } from "@/contexts/LocaleContext";
import { SerwistProvider } from "@serwist/next/react";
import type { ReactNode } from "react";

const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const swUrl = `${base}/sw.js`.replace(/\/{2,}/g, "/");

export function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <SerwistProvider
      swUrl={swUrl}
      disable={process.env.NODE_ENV === "development"}
    >
      <LocaleProvider>
        <CartProvider>{children}</CartProvider>
      </LocaleProvider>
    </SerwistProvider>
  );
}
