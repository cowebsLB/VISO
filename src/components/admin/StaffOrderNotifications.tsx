"use client";

import { getStaffSupabase } from "@/lib/admin/staff-access";
import { BRAND_NAME } from "@/lib/brand";
import { postShowNotificationViaSw } from "@/lib/notifications/post-sw-notification";
import { publicAsset } from "@/lib/basePath";
import { hasSupabaseEnv } from "@/lib/supabase/client";
import { useCallback, useEffect, useState } from "react";

const STORAGE_ENABLED = "anushbadar-admin-order-notif-enabled";
const STORAGE_ENABLED_LEGACY = "viso-admin-order-notif-enabled";
const STORAGE_LAST_CREATED = "anushbadar-admin-order-notif-last-created-at";
const STORAGE_LAST_CREATED_LEGACY = "viso-admin-order-notif-last-created-at";

function migrateOrderNotifStorage(): void {
  if (typeof window === "undefined") return;
  try {
    if (
      localStorage.getItem(STORAGE_ENABLED) == null &&
      localStorage.getItem(STORAGE_ENABLED_LEGACY) != null
    ) {
      localStorage.setItem(STORAGE_ENABLED, localStorage.getItem(STORAGE_ENABLED_LEGACY)!);
      localStorage.removeItem(STORAGE_ENABLED_LEGACY);
    }
    if (
      localStorage.getItem(STORAGE_LAST_CREATED) == null &&
      localStorage.getItem(STORAGE_LAST_CREATED_LEGACY) != null
    ) {
      localStorage.setItem(STORAGE_LAST_CREATED, localStorage.getItem(STORAGE_LAST_CREATED_LEGACY)!);
      localStorage.removeItem(STORAGE_LAST_CREATED_LEGACY);
    }
  } catch {
    /* ignore */
  }
}

const POLL_MS = 45_000;

export function StaffOrderNotifications() {
  const [swReady, setSwReady] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setPermission("unsupported");
      return;
    }
    setPermission(Notification.permission);
    try {
      migrateOrderNotifStorage();
      setEnabled(localStorage.getItem(STORAGE_ENABLED) === "1");
    } catch {
      setEnabled(false);
    }
  }, []);

  useEffect(() => {
    if (process.env.NODE_ENV === "development") return;
    if (!("serviceWorker" in navigator)) return;
    void navigator.serviceWorker.ready.then(() => setSwReady(true));
  }, []);

  const checkNewOrders = useCallback(async () => {
    if (!hasSupabaseEnv()) return;
    const access = await getStaffSupabase();
    if (!access.ok) return;
    const { supabase } = access;

    const { data: latest, error } = await supabase
      .from("orders")
      .select("id, customer_name, status, created_at")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !latest) return;

    let lastCreated: string | null = null;
    try {
      lastCreated = localStorage.getItem(STORAGE_LAST_CREATED);
    } catch {
      lastCreated = null;
    }

    if (!lastCreated) {
      try {
        localStorage.setItem(STORAGE_LAST_CREATED, latest.created_at);
      } catch {
        /* ignore */
      }
      return;
    }

    if (new Date(latest.created_at) <= new Date(lastCreated)) return;

    const { count, error: cErr } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .gt("created_at", lastCreated);

    if (cErr) return;
    const n = count ?? 1;

    const ordersUrl =
      typeof window !== "undefined" ? `${window.location.origin}${publicAsset("/admin/orders")}` : undefined;
    const icon =
      typeof window !== "undefined" ? `${window.location.origin}${publicAsset("/android-chrome-192x192.png")}` : undefined;

    const title = `${BRAND_NAME} — new order`;
    const body =
      n <= 1
        ? `${latest.customer_name} · ${String(latest.status).replaceAll("_", " ")}`
        : `${n} new orders since last check`;

    const ok = await postShowNotificationViaSw({
      title,
      body,
      tag: `anushbadar-order-${latest.id}`,
      icon,
      data: ordersUrl ? { url: ordersUrl } : undefined,
    });

    if (ok) {
      try {
        localStorage.setItem(STORAGE_LAST_CREATED, latest.created_at);
      } catch {
        /* ignore */
      }
    }
  }, []);

  useEffect(() => {
    if (process.env.NODE_ENV === "development") return;
    if (!enabled || permission !== "granted" || !swReady) return;
    void checkNewOrders();
    const id = window.setInterval(() => void checkNewOrders(), POLL_MS);
    return () => window.clearInterval(id);
  }, [enabled, permission, swReady, checkNewOrders]);

  async function enableNotifications() {
    if (permission === "unsupported") return;
    if (permission === "default") {
      const p = await Notification.requestPermission();
      setPermission(p);
      if (p !== "granted") return;
    } else if (Notification.permission !== "granted") {
      return;
    }
    setEnabled(true);
    try {
      localStorage.setItem(STORAGE_ENABLED, "1");
      localStorage.removeItem(STORAGE_LAST_CREATED);
    } catch {
      /* ignore */
    }
  }

  function disable() {
    setEnabled(false);
    try {
      localStorage.setItem(STORAGE_ENABLED, "0");
    } catch {
      /* ignore */
    }
  }

  if (!hasSupabaseEnv() || permission === "unsupported") return null;

  if (process.env.NODE_ENV === "development") {
    return (
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-2 text-center text-xs text-slate-600">
        Order notifications use the service worker in production builds (SW is disabled in dev).
      </div>
    );
  }

  return (
    <div className="border-b border-slate-200 bg-white px-4 py-2">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 text-sm">
        <span className="font-medium text-slate-700">Order notifications</span>
        <div className="flex flex-wrap items-center gap-2">
          {permission === "denied" && (
            <span className="text-xs text-amber-800">Blocked in browser settings — allow notifications for this site.</span>
          )}
          {permission === "default" && (
            <button
              type="button"
              className="rounded-full bg-primary-600 px-3 py-1 text-xs font-semibold text-white hover:bg-primary-700"
              onClick={() => void enableNotifications()}
            >
              Enable
            </button>
          )}
          {permission === "granted" && !enabled && (
            <button
              type="button"
              className="rounded-full bg-primary-600 px-3 py-1 text-xs font-semibold text-white hover:bg-primary-700"
              onClick={() => void enableNotifications()}
            >
              Turn on
            </button>
          )}
          {permission === "granted" && enabled && (
            <>
              <span className="text-xs text-slate-600">
                {swReady ? `On · checking every ${POLL_MS / 1000}s` : "Waiting for service worker…"}
              </span>
              <button
                type="button"
                className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-800 hover:bg-slate-50"
                onClick={disable}
              >
                Turn off
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
