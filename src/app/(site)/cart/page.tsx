"use client";

import { useLocale } from "@/contexts/LocaleContext";
import { useCart } from "@/contexts/CartContext";
import { cartLineTotal, cartSubtotal } from "@/lib/cart";
import Image from "next/image";
import Link from "next/link";
import { productById } from "@/data/products";
import { publicAsset } from "@/lib/basePath";

export default function CartPage() {
  const { messages } = useLocale();
  const { lines, setQty, removeLine } = useCart();
  const t = messages.cart;

  const sub = cartSubtotal(lines);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="font-display text-4xl font-bold text-primary-600">
        {t.title}
      </h1>

      {lines.length === 0 ? (
        <div className="mt-12 rounded-2xl bg-white p-10 text-center shadow-card ring-1 ring-primary/10">
          <p className="text-lg text-slate-600">{t.empty}</p>
          <Link
            href="/catalog"
            className="mt-6 inline-flex rounded-full bg-primary-500 px-8 py-3 font-semibold text-white shadow-soft transition hover:bg-primary-600"
          >
            {t.browse}
          </Link>
        </div>
      ) : (
        <>
          <ul className="mt-8 space-y-4">
            {lines.map((line) => {
              const baseProductId = line.productId.split(":")[0];
              const p = productById(baseProductId);
              return (
                <li
                  key={line.productId}
                  className="flex gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-primary/10"
                >
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-surface">
                    {p && (
                      <Image
                        src={publicAsset(p.image)}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-primary-800">{line.title}</p>
                    <p className="text-sm text-slate-500">
                      ${line.unitPrice.toFixed(2)} × {line.qty}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-3">
                      <label className="flex items-center gap-2 text-sm">
                        <span className="text-slate-600">{t.qty}</span>
                        <input
                          type="number"
                          min={1}
                          value={line.qty}
                          onChange={(e) =>
                            setQty(line.productId, Number(e.target.value))
                          }
                          className="w-16 rounded-lg border border-primary/20 px-2 py-1"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => removeLine(line.productId)}
                        className="text-sm font-medium text-red-600 hover:underline"
                      >
                        {t.remove}
                      </button>
                    </div>
                  </div>
                  <div className="text-right font-semibold text-primary-700">
                    ${cartLineTotal(line).toFixed(2)}
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="mt-8 flex items-center justify-between rounded-2xl bg-primary-50 px-6 py-4 ring-1 ring-primary/15">
            <span className="text-lg font-semibold text-primary-800">
              {t.subtotal}
            </span>
            <span className="text-xl font-bold text-primary-600">
              ${sub.toFixed(2)}
            </span>
          </div>

          <div className="sticky bottom-4 mt-8">
            <Link
              href="/checkout"
              className="flex w-full items-center justify-center rounded-full bg-primary-500 py-4 text-lg font-semibold text-white shadow-soft transition hover:bg-primary-600"
            >
              {t.proceed}
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
