/**
 * One-shot setup for admin order Web Push (linked Supabase project only).
 *
 * Does: generate VAPID + webhook secret → supabase secrets set → db push → functions deploy.
 * You still create the Database Webhook once in the Dashboard (URL + Authorization header printed at the end).
 *
 * Usage (from repo root):
 *   npm run supabase:setup-order-push
 *
 * Public site URL (notification tap target, no trailing slash):
 *   Pass --site-url=https://cowebslb.github.io/VISO
 *   Or set NEXT_PUBLIC_SITE_URL in .env.local before running.
 *
 * Optional: --mailto=mailto:you@example.com  (VAPID subject; default mailto:orders@anushbadar.local)
 */
import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import webpush from "web-push";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const secretsPath = path.join(repoRoot, "supabase", ".push-setup-secrets.env");

function arg(name) {
  const prefix = `--${name}=`;
  const hit = process.argv.find((a) => a.startsWith(prefix));
  return hit ? hit.slice(prefix.length).replace(/^["']|["']$/g, "") : undefined;
}

function loadSiteUrlFromEnvLocal() {
  const p = path.join(repoRoot, ".env.local");
  if (!fs.existsSync(p)) return "";
  const text = fs.readFileSync(p, "utf8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const m = trimmed.match(/^NEXT_PUBLIC_SITE_URL=(.*)$/);
    if (m) return m[1].trim().replace(/^["']|["']$/g, "");
  }
  return "";
}

function loadSupabaseUrlFromEnvLocal() {
  const p = path.join(repoRoot, ".env.local");
  if (!fs.existsSync(p)) return "";
  const text = fs.readFileSync(p, "utf8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const m = trimmed.match(/^NEXT_PUBLIC_SUPABASE_URL=(.*)$/);
    if (m) return m[1].trim().replace(/^["']|["']$/g, "");
  }
  return "";
}

function projectRefFromSupabaseUrl(url) {
  try {
    const u = new URL(url);
    const host = u.hostname;
    const m = host.match(/^([a-z0-9]+)\.supabase\.co$/i);
    return m ? m[1] : "";
  } catch {
    return "";
  }
}

function run(label, command, args) {
  console.log(`\n→ ${label}…`);
  const isWin = process.platform === "win32";
  const cmd = command === "npx" && isWin ? "npx.cmd" : command;
  const r = spawnSync(cmd, args, {
    cwd: repoRoot,
    stdio: "inherit",
    shell: false,
    env: process.env,
  });
  if (r.status !== 0) {
    console.error(`\nFailed: ${label} (exit ${r.status ?? "unknown"})`);
    process.exit(r.status ?? 1);
  }
}

const siteUrlRaw = arg("site-url") || process.env.ORDER_PUSH_SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || loadSiteUrlFromEnvLocal();
const siteUrl = siteUrlRaw.replace(/\/$/, "");
if (!siteUrl || !/^https?:\/\//i.test(siteUrl)) {
  console.error(
    "Missing public site URL. Set NEXT_PUBLIC_SITE_URL in .env.local or run:\n" +
      "  npm run supabase:setup-order-push -- --site-url=https://YOUR_DOMAIN/VISO",
  );
  process.exit(1);
}

const mailto = arg("mailto") || process.env.ORDER_PUSH_VAPID_SUBJECT || "mailto:orders@anushbadar.local";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || loadSupabaseUrlFromEnvLocal();
const projectRef = projectRefFromSupabaseUrl(supabaseUrl);

const vapidKeys = webpush.generateVAPIDKeys();
const webhookSecret = crypto.randomBytes(32).toString("hex");

const lines = [
  `VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`,
  `VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`,
  `VAPID_SUBJECT=${mailto}`,
  `ORDER_PUSH_WEBHOOK_SECRET=${webhookSecret}`,
  `ORDER_PUSH_SITE_URL=${siteUrl}`,
  `ORDER_NOTIFICATION_BRAND=Anush Badar`,
  "",
].join("\n");

fs.mkdirSync(path.dirname(secretsPath), { recursive: true });
fs.writeFileSync(secretsPath, lines, "utf8");
console.log(`Wrote ${path.relative(repoRoot, secretsPath)} (gitignored — contains secrets).`);

run("Upload Edge secrets", "npx", ["supabase", "secrets", "set", "--env-file", "supabase/.push-setup-secrets.env"]);
run("Apply database migrations", "npx", ["supabase", "db", "push", "--yes"]);
run("Deploy send-order-push function", "npx", ["supabase", "functions", "deploy", "send-order-push"]);

const fnUrl = projectRef
  ? `https://${projectRef}.supabase.co/functions/v1/send-order-push`
  : "(set NEXT_PUBLIC_SUPABASE_URL in .env.local to show URL — or build from project ref)";

console.log(`
================================================================================
DONE — one manual step left (Supabase Dashboard)
================================================================================

1) Database → Webhooks → Create webhook
   - Table: orders
   - Events: INSERT (only)
   - URL: ${fnUrl}
   - HTTP header:  Authorization  =  Bearer ${webhookSecret}

2) Add to .env.local and redeploy / restart dev:

   NEXT_PUBLIC_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}

   For GitHub Pages, add repo secret NEXT_PUBLIC_VAPID_PUBLIC_KEY with the same value.

3) Delete or secure: supabase/.push-setup-secrets.env (still has private VAPID + webhook secret copy)

4) Test on a production build: Admin → enable notifications → place test order.
================================================================================
`);
