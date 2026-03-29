"use client";

import { useLocale } from "@/contexts/LocaleContext";
import { useCart } from "@/contexts/CartContext";
import { cartSubtotal } from "@/lib/cart";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import Link from "next/link";
import { useMemo, useState } from "react";

export default function CheckoutPage() {
  const { messages, locale } = useLocale();
  const { lines } = useCart();
  const t = messages.checkout;
  const cartLabels = messages.cart;
  const sub = cartSubtotal(lines);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [when, setWhen] = useState("");
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});

  const waNumber = process.env.NEXT_PUBLIC_WHATSAPP_ORDER_NUMBER ?? "9610000000";

  const message = useMemo(() => {
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
        : `${items}\n\n${cartLabels.subtotal}: $${sub.toFixed(2)}\n\n` +
          `${t.name}: ${name}\n${t.phone}: ${phone}\n` +
          (notes ? `${t.notes}: ${notes}\n` : "") +
          (when ? `${t.when}: ${when}\n` : "") +
          `\n${t.orderThanks}`;
    return header + body;
  }, [lines, sub, name, phone, notes, when, t, cartLabels, locale]);

  function submit() {
    const e: { name?: string; phone?: string } = {};
    if (!name.trim()) e.name = t.nameRequired;
    if (!phone.trim()) e.phone = t.phoneRequired;
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    if (lines.length === 0) {
      alert(t.emptyCart);
      return;
    }
    const url = buildWhatsAppUrl(waNumber, message);
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="font-display text-4xl font-bold text-primary-600">
        {t.title}
      </h1>

      {lines.length === 0 ? (
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
              {lines.map((l) => (
                <li key={l.productId}>
                  {l.title} × {l.qty} — $
                  {(l.unitPrice * l.qty).toFixed(2)}
                </li>
              ))}
            </ul>
            <p className="mt-4 border-t border-primary/10 pt-4 font-semibold text-primary-700">
              {cartLabels.subtotal}: ${sub.toFixed(2)}
            </p>
          </section>

          <form
            className="mt-8 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
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

            <div className="flex flex-col gap-4 pt-4 sm:flex-row">
              <button
                type="submit"
                className="flex-1 rounded-full bg-[#25D366] py-4 text-lg font-semibold text-white shadow-soft transition hover:brightness-105 active:scale-[0.99]"
              >
                {t.sendWhatsApp}
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
