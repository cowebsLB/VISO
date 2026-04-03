/**
 * Ask the Serwist service worker to show a system notification (same registration as caching).
 * Staff-only: never show from public storefront routes.
 * Requires Notification.permission === "granted" and an active service worker.
 */
export async function postShowNotificationViaSw(payload: {
  title: string;
  body: string;
  tag?: string;
  icon?: string;
  badge?: string;
  data?: { url?: string };
}): Promise<boolean> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return false;
  if (!/\/admin(\/|$)/.test(window.location.pathname)) return false;
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return false;
  const reg = await navigator.serviceWorker.ready;
  if (!reg.active) return false;
  reg.active.postMessage({
    type: "SITE_SHOW_NOTIFICATION",
    ...payload,
  });
  return true;
}
