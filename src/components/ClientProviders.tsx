"use client";

import { CartProvider } from "@/contexts/CartContext";
import { LocaleProvider } from "@/contexts/LocaleContext";
import { basePath } from "@/lib/basePath";
import { SerwistProvider } from "@serwist/next/react";
import type { ReactNode } from "react";
import { useEffect } from "react";

const swUrl = `${basePath}/sw.js`.replace(/\/{2,}/g, "/");

/**
 * Stale Serwist/PWA caches from a prior `next start`, static preview, or production
 * often intercept `/_next/static/*` on localhost and return 404 for dev chunks. Clear SW +
 * Cache Storage on dev so admin routes load scripts correctly.
 */
function useClearStalePwaCachesInDev() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    const host = window.location.hostname;
    if (host !== "localhost" && host !== "127.0.0.1") return;

    void (async () => {
      try {
        if ("serviceWorker" in navigator) {
          const regs = await navigator.serviceWorker.getRegistrations();
          await Promise.all(regs.map((r) => r.unregister()));
        }
        if (typeof caches !== "undefined") {
          const keys = await caches.keys();
          await Promise.all(keys.map((k) => caches.delete(k)));
        }
      } catch {
        /* ignore */
      }
    })();
  }, []);
}

export function ClientProviders({ children }: { children: ReactNode }) {
  useClearStalePwaCachesInDev();

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
