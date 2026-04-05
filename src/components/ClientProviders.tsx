"use client";

import { BasePathDevRedirect } from "@/components/BasePathDevRedirect";
import { CartProvider } from "@/contexts/CartContext";
import { LocaleProvider } from "@/contexts/LocaleContext";
import { basePath } from "@/lib/basePath";
import { SerwistProvider } from "@serwist/next/react";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect } from "react";

const publicSwUrl = `${basePath}/sw.js`.replace(/\/{2,}/g, "/");
const adminSwUrl = `${basePath}/admin/sw.js`.replace(/\/{2,}/g, "/");

function publicSwScope(): string {
  const p = basePath || "/";
  return p.endsWith("/") ? p : `${p}/`;
}

function adminSwScope(): string {
  const prefix = basePath ? `${basePath}/admin` : "/admin";
  return prefix.endsWith("/") ? prefix : `${prefix}/`;
}

/**
 * Same fix as `LocalhostPwaCacheBustScript` after hydration (localhost / 127.0.0.1 only).
 * Covers `next dev` and `next start` on localhost — not production hostnames.
 */
function useClearStalePwaCachesOnLocalhost() {
  useEffect(() => {
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

/** Serwist keeps a `window.serwist` singleton; clear it on unmount so admin ↔ storefront switches can register the right worker. */
function StorefrontSerwist({ children }: { children: ReactNode }) {
  useEffect(() => {
    return () => {
      if (typeof window === "undefined") return;
      Reflect.deleteProperty(window as object, "serwist");
    };
  }, []);

  return (
    <SerwistProvider
      swUrl={publicSwUrl}
      disable={false}
      options={{ scope: publicSwScope() }}
    >
      {children}
    </SerwistProvider>
  );
}

function useRegisterAdminServiceWorker(isAdminRoute: boolean) {
  useEffect(() => {
    if (!isAdminRoute || typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }
    const scope = adminSwScope();
    void navigator.serviceWorker.register(adminSwUrl, { scope });
  }, [isAdminRoute]);
}

export function ClientProviders({ children }: { children: ReactNode }) {
  useClearStalePwaCachesOnLocalhost();
  const pathname = usePathname() ?? "";
  const isAdminRoute = pathname.startsWith("/admin");
  useRegisterAdminServiceWorker(isAdminRoute);

  const inner = (
    <>
      <BasePathDevRedirect />
      <LocaleProvider>
        <CartProvider>{children}</CartProvider>
      </LocaleProvider>
    </>
  );

  if (process.env.NODE_ENV === "development") {
    return (
      <SerwistProvider swUrl={publicSwUrl} disable>
        {inner}
      </SerwistProvider>
    );
  }

  if (isAdminRoute) {
    return inner;
  }

  return <StorefrontSerwist>{inner}</StorefrontSerwist>;
}
