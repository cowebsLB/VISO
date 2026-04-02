"use client";

import { useLocale } from "@/contexts/LocaleContext";
import { useCart } from "@/contexts/CartContext";
import { cartSubtotal, emptyCart, type CartLine } from "@/lib/cart";
import { buildCreateOrderFromCheckoutPayload } from "@/lib/checkout/build-payload";
import { hasSupabaseEnv, createSupabaseAnonClient } from "@/lib/supabase/client";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import Link from "next/link";
import { useMemo, useState } from "react";

function buildWhatsAppBody(params: {
  lines: CartLine[];
  sub: number;
  name: string;
  phone: string;
  notes: string;
  when: string;
  orderId: string | null;
  t: {
    orderPrefix: string;
    name: string;
    phone: string;
    notes: string;
    when: string;
    orderThanks: string;
  };
  cartSubtotalLabel: string;
  locale: string;
}): string {
  const {
    lines,
    sub,
    name,
    phone,
    notes,
    when,
    orderId,
    t,
    cartSubtotalLabel,
    locale,
  } = params;
  const header = `${t.orderPrefix} (${locale.toUpperCase()})\n`;
  const items = lines
    .map(
      (l) =>
        `• ${l.title} × ${l.qty} @ $${l.unitPrice.toFixed(2)} = $${(l.unitPrice * l.qty).toFixed(2)}`,
    )
    .join("\n");
  const body =
    lines.length === 0
      ? ""
      : `${items}\n\n${cartSubtotalLabel}: $${sub.toFixed(2)}\n\n` +
        `${t.name}: ${name}\n${t.phone}: ${phone}\n` +
        (notes ? `${t.notes}: ${notes}\n` : "") +
        (when ? `${t.when}: ${when}\n` : "") +
        (orderId ? `Order ref: ${orderId}\n` : "") +
        `\n${t.orderThanks}`;
  return header + body;
}

export default function CheckoutPage() {
  const { messages, locale } = useLocale();
  const { lines, setCart } = useCart();
  const t = messages.checkout;
  const cartLabels = messages.cart;
  const sub = cartSubtotal(lines);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [when, setWhen] = useState("");
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [rpcError, setRpcError] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [completedSummary, setCompletedSummary] = useState<{
    sub: number;
    lines: { title: string; qty: number; lineTotal: number }[];
  } | null>(null);

  const waNumber = process.env.NEXT_PUBLIC_WHATSAPP_ORDER_NUMBER ?? "96171408822";

  const messagePreview = useMemo(() => {
    return buildWhatsAppBody({
      lines,
      sub,
      name,
      phone,
      notes,
      when,
      orderId,
      t,
      cartSubtotalLabel: cartLabels.subtotal,
      locale,
    });
  }, [lines, sub, name, phone, notes, when, orderId, t, cartLabels.subtotal, locale]);

  function validate(): boolean {
    const e: { name?: string; phone?: string } = {};
    if (!name.trim()) e.name = t.nameRequired;
    if (!phone.trim()) e.phone = t.phoneRequired;
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function formatRpcError(err: { message: string; details?: string; hint?: string }): string {
    const parts = [err.message, err.details, err.hint].filter(Boolean);
    return parts.join(" — ");
  }

  async function submitWhatsAppCheckout(e: React.FormEvent) {
    e.preventDefault();
    setRpcError(null);
    if (!validate()) return;
    if (lines.length === 0) {
      alert(t.emptyCart);
      return;
    }

    const snapshotLines = [...lines];
    const snapshotSub = cartSubtotal(snapshotLines);
    const snapshotName = name.trim();
    const snapshotPhone = phone.trim();
    const snapshotNotes = notes.trim();
    const snapshotWhen = when.trim();

    if (hasSupabaseEnv()) {
      setSubmitting(true);
      try {
        const supabase = createSupabaseAnonClient();
        const payload = buildCreateOrderFromCheckoutPayload(snapshotLines, {
          customerName: snapshotName,
          phone: snapshotPhone,
          notes,
          pickupNote: when,
          locale,
        });
        const { data, error } = await supabase.rpc("create_order_from_checkout", {
          payload,
        });
        if (error) {
          setRpcError(formatRpcError(error) || t.orderSubmitError);
          return;
        }
        const id = typeof data === "string" ? data : String(data);
        setOrderId(id);
        setCompletedSummary({
          sub: snapshotSub,
          lines: snapshotLines.map((l) => ({
            title: l.title,
            qty: l.qty,
            lineTotal: l.unitPrice * l.qty,
          })),
        });
        setCart(emptyCart());

        const waText = buildWhatsAppBody({
          lines: snapshotLines,
          sub: snapshotSub,
          name: snapshotName,
          phone: snapshotPhone,
          notes: snapshotNotes,
          when: snapshotWhen,
          orderId: id,
          t,
          cartSubtotalLabel: cartLabels.subtotal,
          locale,
        });
        const url = buildWhatsAppUrl(waNumber, waText);
        window.open(url, "_blank", "noopener,noreferrer");
      } catch (err) {
        setRpcError(err instanceof Error ? err.message : t.orderSubmitError);
      } finally {
        setSubmitting(false);
      }
      return;
    }

    const url = buildWhatsAppUrl(waNumber, messagePreview);
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="font-display text-4xl font-bold text-primary-600">
        {t.title}
      </h1>

      {lines.length === 0 && !orderId && !completedSummary ? (
        <p className="mt-8 rounded-2xl bg-amber-50 p-6 text-amber-900 ring-1 ring-amber-200">
          {t.emptyCart}{" "}
          <Link href="/catalog" className="font-semibold underline">
            {messages.cart.browse}
          </Link>
        </p>
      ) : (
        <>
          <section className="mt-8 rounded-2xl bg-white p-6 shadow-card ring-1 ring-primary/10">
            <h2 className="font-display text-xl font-semibold text-primary-800">
              {t.summary}
            </h2>
            <ul className="mt-4 space-y-2 text-slate-700">
              {completedSummary
                ? completedSummary.lines.map((l, i) => (
                    <li key={`done-${i}`}>
                      {l.title} × {l.qty} — ${l.lineTotal.toFixed(2)}
                    </li>
                  ))
                : lines.map((l) => (
                    <li key={l.productId}>
                      {l.title} × {l.qty} — $
                      {(l.unitPrice * l.qty).toFixed(2)}
                    </li>
                  ))}
            </ul>
            <p className="mt-4 border-t border-primary/10 pt-4 font-semibold text-primary-700">
              {cartLabels.subtotal}: $
              {(completedSummary ? completedSummary.sub : sub).toFixed(2)}
            </p>
          </section>

          {orderId && (
            <p
              className="mt-6 rounded-2xl bg-emerald-50 p-4 text-emerald-900 ring-1 ring-emerald-200"
              role="status"
            >
              {t.orderSubmitted} <span className="font-mono font-semibold">{orderId}</span>
            </p>
          )}

          <form className="mt-8 space-y-4" onSubmit={(e) => void submitWhatsAppCheckout(e)}>
            <div>
              <label htmlFor="co-name" className="block text-sm font-medium text-slate-700">
                {t.name}
              </label>
              <input
                id="co-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-xl border border-primary/20 px-4 py-3 outline-none ring-primary/30 focus:ring-2"
                autoComplete="name"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>
            <div>
              <label htmlFor="co-phone" className="block text-sm font-medium text-slate-700">
                {t.phone}
              </label>
              <input
                id="co-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                type="tel"
                className="mt-1 w-full rounded-xl border border-primary/20 px-4 py-3 outline-none ring-primary/30 focus:ring-2"
                autoComplete="tel"
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
              )}
            </div>
            <div>
              <label htmlFor="co-notes" className="block text-sm font-medium text-slate-700">
                {t.notes}
              </label>
              <textarea
                id="co-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="mt-1 w-full rounded-xl border border-primary/20 px-4 py-3 outline-none ring-primary/30 focus:ring-2"
              />
            </div>
            <div>
              <label htmlFor="co-when" className="block text-sm font-medium text-slate-700">
                {t.when}
              </label>
              <input
                id="co-when"
                value={when}
                onChange={(e) => setWhen(e.target.value)}
                className="mt-1 w-full rounded-xl border border-primary/20 px-4 py-3 outline-none ring-primary/30 focus:ring-2"
              />
            </div>

            {rpcError && (
              <p className="rounded-xl bg-red-50 p-3 text-sm text-red-800 ring-1 ring-red-200">
                {rpcError}
              </p>
            )}
            {!hasSupabaseEnv() && (
              <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900 ring-1 ring-amber-200">
                {t.supabaseMissing}
              </p>
            )}

            <div className="flex flex-col gap-4 pt-4 sm:flex-row">
              <button
                type="submit"
                disabled={lines.length === 0 || submitting}
                className="flex-1 rounded-full bg-[#25D366] py-4 text-lg font-semibold text-white shadow-soft transition hover:brightness-105 active:scale-[0.99] disabled:opacity-50"
              >
                {submitting ? "…" : t.sendWhatsApp}
              </button>
              <Link
                href="/cart"
                className="flex flex-1 items-center justify-center rounded-full border-2 border-primary-300 py-4 text-center font-semibold text-primary-700 hover:bg-primary-50"
              >
                {t.editCart}
              </Link>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
