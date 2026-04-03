import type { SupabaseClient } from "@supabase/supabase-js";

export function getVapidPublicKey(): string | undefined {
  const k = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  return k?.trim() || undefined;
}

export function urlBase64ToUint8Array(base64String: string): BufferSource {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = globalThis.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function syncAdminPushSubscription(
  supabase: SupabaseClient,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const vapid = getVapidPublicKey();
  if (!vapid) {
    return { ok: false, message: "NEXT_PUBLIC_VAPID_PUBLIC_KEY is not set" };
  }
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return { ok: false, message: "Service workers not available" };
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    return { ok: false, message: "Not signed in" };
  }

  const reg = await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    try {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapid),
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return { ok: false, message: msg };
    }
  }

  const json = sub.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
    return { ok: false, message: "Invalid push subscription" };
  }

  const { error } = await supabase.from("admin_push_subscriptions").upsert(
    {
      user_id: session.user.id,
      endpoint: json.endpoint,
      p256dh: json.keys.p256dh,
      auth: json.keys.auth,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "endpoint" },
  );

  if (error) {
    return { ok: false, message: error.message };
  }
  return { ok: true };
}

export async function removeAdminPushSubscription(supabase: SupabaseClient): Promise<void> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  if (!sub) return;
  const endpoint = sub.endpoint;
  await supabase.from("admin_push_subscriptions").delete().eq("endpoint", endpoint);
  await sub.unsubscribe();
}
