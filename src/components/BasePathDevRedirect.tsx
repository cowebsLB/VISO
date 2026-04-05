"use client";

import { useEffect } from "react";

/**
 * When `NEXT_PUBLIC_FORCE_BASE_PATH_IN_DEV=true` and `NEXT_PUBLIC_BASE_PATH` is set (e.g. `/VISO`),
 * Next serves all routes under that prefix. Opening `http://localhost:3040/admin` 404s and can
 * produce broken RSC requests (e.g. odd `…VISO…` + `.txt` flight URLs). Redirect once on mount.
 *
 * Middleware is avoided here because this app uses `output: "export"` for production (no middleware).
 */
export function BasePathDevRedirect() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    const prefix = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").trim().replace(/\/$/, "");
    if (!prefix || process.env.NEXT_PUBLIC_FORCE_BASE_PATH_IN_DEV !== "true") return;

    const { pathname, search, hash } = window.location;
    if (pathname.startsWith("/_next")) return;
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) return;

    const targetPath = pathname === "/" ? `${prefix}/` : `${prefix}${pathname}`;
    window.location.replace(`${targetPath}${search}${hash}`);
  }, []);

  return null;
}
