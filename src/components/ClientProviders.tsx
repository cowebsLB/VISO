"use client";

import { CartProvider } from "@/contexts/CartContext";
import { LocaleProvider } from "@/contexts/LocaleContext";
import { basePath } from "@/lib/basePath";
import { SerwistProvider } from "@serwist/next/react";
import type { ReactNode } from "react";
import { useEffect } from "react";

const swUrl = `${basePath}/sw.js`.replace(/\/{2,}/g, "/");

function useUnregisterStaleServiceWorkerInDev() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    const host = window.location.hostname;
    if (host !== "localhost" && host !== "127.0.0.1") return;
    if (!("serviceWorker" in navigator)) return;
    void navigator.serviceWorker.getRegistrations().then((regs) => {
      void Promise.all(regs.map((r) => r.unregister()));
    });
  }, []);
}

export function ClientProviders({ children }: { children: ReactNode }) {
  useUnregisterStaleServiceWorkerInDev();

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
