/**
 * Triggered by a Database Webhook on INSERT into public.orders.
 * Sends Web Push to every row in public.admin_push_subscriptions.
 *
 * Secrets (Dashboard → Edge Functions → Secrets): see docs/admin-push-notifications.md
 */
import { createClient } from "jsr:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

type OrderRow = {
  id: string;
  customer_name: string;
  status: string;
  created_at: string;
};

type WebhookBody = {
  type?: string;
  eventType?: string;
  table?: string;
  schema?: string;
  record?: OrderRow;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/** Prefer Authorization header; fall back to ?Authorization=… when Dashboard sends it as HTTP Parameters (pg_net). */
function getWebhookBearer(req: Request): string {
  const header = req.headers.get("Authorization")?.trim();
  if (header) return header;
  try {
    const u = new URL(req.url);
    const q =
      u.searchParams.get("Authorization") ?? u.searchParams.get("authorization");
    if (q) return q.trim().replace(/\s+/g, " ");
  } catch {
    /* ignore */
  }
  return "";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const webhookSecret = Deno.env.get("ORDER_PUSH_WEBHOOK_SECRET");
  const auth = getWebhookBearer(req);
  if (!webhookSecret || auth !== `Bearer ${webhookSecret}`) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const vapidPublic = Deno.env.get("VAPID_PUBLIC_KEY");
  const vapidPrivate = Deno.env.get("VAPID_PRIVATE_KEY");
  const vapidSubject = Deno.env.get("VAPID_SUBJECT");
  const siteUrl = (Deno.env.get("ORDER_PUSH_SITE_URL") ?? "").replace(/\/$/, "");
  const brand = Deno.env.get("ORDER_NOTIFICATION_BRAND") ?? "New order";

  if (!vapidPublic || !vapidPrivate || !vapidSubject) {
    console.error("send-order-push: missing VAPID_* env");
    return new Response(JSON.stringify({ error: "Server misconfigured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);

  let body: WebhookBody;
  try {
    body = (await req.json()) as WebhookBody;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const evtType = body.type ?? body.eventType;
  if (evtType !== "INSERT" || body.table !== "orders" || body.schema !== "public" || !body.record) {
    return new Response(JSON.stringify({ ok: true, skipped: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const order = body.record;
  const ordersPath = "/admin/orders";
  const notificationUrl = siteUrl ? `${siteUrl}${ordersPath}` : "";

  const title = `${brand} — new order`;
  const bodyText = `${order.customer_name} · ${String(order.status).replaceAll("_", " ")}`;
  const payload = JSON.stringify({
    title,
    body: bodyText,
    tag: `order-${order.id}`,
    url: notificationUrl || undefined,
  });

  const supabase = createClient(supabaseUrl, serviceKey);
  const { data: subs, error: listErr } = await supabase.from("admin_push_subscriptions").select(
    "id, endpoint, p256dh, auth",
  );

  if (listErr) {
    console.error("send-order-push: list subscriptions", listErr);
    return new Response(JSON.stringify({ error: listErr.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let sent = 0;
  let failed = 0;

  for (const row of subs ?? []) {
    const pushSub = {
      endpoint: row.endpoint,
      keys: { p256dh: row.p256dh, auth: row.auth },
    };

    try {
      await webpush.sendNotification(pushSub, payload, {
        TTL: 86_400,
        urgency: "high",
      });
      sent++;
    } catch (e: unknown) {
      const status = typeof e === "object" && e !== null && "statusCode" in e
        ? (e as { statusCode?: number }).statusCode
        : undefined;
      if (status === 410 || status === 404) {
        await supabase.from("admin_push_subscriptions").delete().eq("id", row.id);
      }
      failed++;
      console.error("send-order-push: push failed", row.id, status, e);
    }
  }

  return new Response(JSON.stringify({ ok: true, sent, failed, total: (subs ?? []).length }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
