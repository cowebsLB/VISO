/// <reference lib="webworker" />
import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope & {
  __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
};

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
});

serwist.addEventListeners();

/** Staff/admin: show system notification from the page via postMessage (same registration as Serwist). */
type ShowNotificationMessage = {
  type: "SITE_SHOW_NOTIFICATION";
  title: string;
  body: string;
  tag?: string;
  icon?: string;
  badge?: string;
  data?: { url?: string };
};

self.addEventListener("message", (event: ExtendableMessageEvent) => {
  const data = event.data as ShowNotificationMessage | undefined;
  if (!data || data.type !== "SITE_SHOW_NOTIFICATION") return;
  const { title, body, tag, icon, badge, data: notifData } = data;
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      tag: tag ?? "site-admin",
      icon,
      badge,
      data: notifData,
    }),
  );
});

self.addEventListener("notificationclick", (event: NotificationEvent) => {
  event.notification.close();
  const url = (event.notification.data as { url?: string } | undefined)?.url;
  if (!url) return;
  event.waitUntil(
    (async () => {
      const all = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const c of all) {
        if (c.url.includes("/admin") && "focus" in c) {
          await (c as WindowClient).focus();
          return;
        }
      }
      await self.clients.openWindow(url);
    })(),
  );
});
