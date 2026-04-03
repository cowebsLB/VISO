/* Admin-only PWA service worker (nested scope …/admin/). No Serwist precache — network-first by default. */
self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let title = "New order";
  let body = "";
  let tag = "site-admin-order";
  let icon;
  let url;
  if (event.data) {
    try {
      const j = event.data.json();
      if (j.title) title = j.title;
      if (j.body) body = j.body;
      if (j.tag) tag = j.tag;
      if (j.url) url = j.url;
      if (j.icon) icon = j.icon;
    } catch {
      body = event.data.text() || "";
    }
  }
  event.waitUntil(
    self.registration.showNotification(title, {
      body: body || "Open admin to view orders.",
      tag,
      icon,
      data: url ? { url } : undefined,
    }),
  );
});

self.addEventListener("message", (event) => {
  const data = event.data;
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

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data && event.notification.data.url;
  if (!url) return;
  event.waitUntil(
    (async () => {
      const all = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      for (const c of all) {
        if (c.url.includes("/admin") && "focus" in c) {
          await /** @type {WindowClient} */ (c).focus();
          return;
        }
      }
      await self.clients.openWindow(url);
    })(),
  );
});
