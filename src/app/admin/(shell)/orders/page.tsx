"use client";

import type { OrderStatus } from "@/lib/order-status";
import {
  allowedNextStatuses,
  mustUseConfirmOrder,
} from "@/lib/order-status";
import { getStaffSupabase } from "@/lib/admin/staff-access";
import { createSupabaseAnonClient, hasSupabaseEnv } from "@/lib/supabase/client";
import { useCallback, useEffect, useMemo, useState } from "react";

type OrderRow = {
  id: string;
  status: OrderStatus;
  source: string;
  customer_name: string;
  phone: string;
  subtotal: string | number;
  created_at: string;
  inventory_applied_at: string | null;
  locale: string | null;
};

type OrderItemRow = {
  id: string;
  product_id: string;
  option_id: string | null;
  qty: number;
  unit_price: string | number;
  line_total: string | number;
  title_snapshot: string;
};

type ManualLine = {
  product_id: string;
  option_id: string;
  qty: number;
};

type ProductChoice = {
  id: string;
  label: string;
  options: { id: string; label: string; unit_price: number }[];
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [itemsByOrder, setItemsByOrder] = useState<Record<string, OrderItemRow[]>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<ProductChoice[]>([]);

  const [manualName, setManualName] = useState("");
  const [manualPhone, setManualPhone] = useState("");
  const [manualNotes, setManualNotes] = useState("");
  const [manualLines, setManualLines] = useState<ManualLine[]>([
    { product_id: "", option_id: "", qty: 1 },
  ]);

  const loadOrders = useCallback(async () => {
    if (!hasSupabaseEnv()) return;
    const access = await getStaffSupabase();
    if (!access.ok) {
      setError(access.message);
      setOrders([]);
      return;
    }
    setError(null);
    const { supabase } = access;
    const { data, error: qErr } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    if (qErr) {
      setError(qErr.message);
      return;
    }
    setOrders((data ?? []) as OrderRow[]);
  }, []);

  const loadProductChoices = useCallback(async () => {
    if (!hasSupabaseEnv()) return;
    const supabase = createSupabaseAnonClient();
    const { data: prows } = await supabase.from("products").select("id").eq("is_active", true);
    const ids = (prows ?? []).map((p) => p.id);
    if (!ids.length) return;
    const [{ data: opts }, { data: pi18n }, { data: oi18n }] = await Promise.all([
      supabase.from("product_options").select("*").in("product_id", ids),
      supabase.from("product_i18n").select("*").eq("locale", "en").in("product_id", ids),
      supabase.from("product_option_i18n").select("*").eq("locale", "en").in("product_id", ids),
    ]);
    const nameByPid = new Map((pi18n ?? []).map((r) => [r.product_id, r.name as string]));
    const choices: ProductChoice[] = [];
    for (const pid of ids) {
      const olist = (opts ?? [])
        .filter((o) => o.product_id === pid)
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((o) => {
          const label =
            (oi18n ?? []).find((r) => r.product_id === pid && r.option_id === o.id)?.name ??
            o.id;
          return {
            id: o.id,
            label,
            unit_price: Number(o.unit_price),
          };
        });
      choices.push({
        id: pid,
        label: nameByPid.get(pid) ?? pid,
        options: olist,
      });
    }
    setProducts(choices);
  }, []);

  useEffect(() => {
    void (async () => {
      await loadOrders();
      setLoading(false);
    })();
    void loadProductChoices();
  }, [loadOrders, loadProductChoices]);

  useEffect(() => {
    if (!hasSupabaseEnv()) return;
    const supabase = createSupabaseAnonClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void loadOrders();
    });
    return () => subscription.unsubscribe();
  }, [loadOrders]);

  useEffect(() => {
    if (!selectedId || !hasSupabaseEnv()) return;
    void (async () => {
      const access = await getStaffSupabase();
      if (!access.ok) return;
      const { supabase } = access;
      const { data } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", selectedId);
      setItemsByOrder((prev) => ({
        ...prev,
        [selectedId]: (data ?? []) as OrderItemRow[],
      }));
    })();
  }, [selectedId]);

  const selected = useMemo(
    () => orders.find((o) => o.id === selectedId) ?? null,
    [orders, selectedId],
  );

  async function refresh() {
    setLoading(true);
    await loadOrders();
    setLoading(false);
  }

  async function confirmOrder(orderId: string) {
    if (!hasSupabaseEnv()) return;
    const ok = window.confirm(
      "Confirm this order? Inventory will be deducted. Stock may go negative — family bakery mode.",
    );
    if (!ok) return;
    const supabase = createSupabaseAnonClient();
    const { error: rpcErr } = await supabase.rpc("confirm_order", { p_order_id: orderId });
    if (rpcErr) {
      setError(rpcErr.message);
      return;
    }
    await refresh();
  }

  async function setStatus(orderId: string, next: OrderStatus) {
    if (!hasSupabaseEnv()) return;
    const supabase = createSupabaseAnonClient();
    const { error: rpcErr } = await supabase.rpc("update_order_status", {
      p_order_id: orderId,
      p_next: next,
    });
    if (rpcErr) {
      setError(rpcErr.message);
      return;
    }
    await refresh();
  }

  async function submitManual(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!hasSupabaseEnv()) return;
    if (!manualName.trim() || !manualPhone.trim()) {
      setError("Name and phone are required.");
      return;
    }
    const supabase = createSupabaseAnonClient();
    const linesPayload = [];
    for (const ml of manualLines) {
      if (!ml.product_id || !ml.option_id || ml.qty < 1) continue;
      const p = products.find((x) => x.id === ml.product_id);
      const opt = p?.options.find((o) => o.id === ml.option_id);
      if (!p || !opt) continue;
      const title = `${p.label} — ${opt.label}`;
      const unit = opt.unit_price;
      const lineTotal = unit * ml.qty;
      linesPayload.push({
        product_id: ml.product_id,
        option_id: ml.option_id,
        qty: ml.qty,
        unit_price: unit,
        line_total: lineTotal,
        title_snapshot: title,
      });
    }
    if (!linesPayload.length) {
      setError("Add at least one valid line.");
      return;
    }
    const subtotal = linesPayload.reduce((s, l) => s + l.line_total, 0);
    const { error: rpcErr } = await supabase.rpc("create_order_manual", {
      payload: {
        subtotal,
        customer_name: manualName.trim(),
        phone: manualPhone.trim(),
        notes: manualNotes.trim() || null,
        pickup_note: null,
        locale: "en",
        currency: "USD",
        lines: linesPayload,
      },
    });
    if (rpcErr) {
      setError(rpcErr.message);
      return;
    }
    setManualName("");
    setManualPhone("");
    setManualNotes("");
    setManualLines([{ product_id: "", option_id: "", qty: 1 }]);
    await refresh();
  }

  if (!hasSupabaseEnv()) {
    return (
      <p className="rounded-xl bg-amber-50 p-4 text-amber-900">
        Configure Supabase environment variables.
      </p>
    );
  }

  return (
    <div className="space-y-10">
      <h1 className="font-display text-3xl font-bold text-primary-800">Orders</h1>

      {error && (
        <p className="rounded-xl bg-red-50 p-3 text-sm text-red-800 ring-1 ring-red-200" role="alert">
          {error}
        </p>
      )}

      <section className="rounded-2xl bg-white p-6 shadow-card ring-1 ring-slate-200">
        <h2 className="font-display text-xl font-semibold text-primary-800">New manual order</h2>
        <form onSubmit={(e) => void submitManual(e)} className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700">Customer name</label>
              <input
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Phone</label>
              <input
                value={manualPhone}
                onChange={(e) => setManualPhone(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Notes</label>
            <textarea
              value={manualNotes}
              onChange={(e) => setManualNotes(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              rows={2}
            />
          </div>
          {manualLines.map((line, idx) => (
            <div key={idx} className="flex flex-wrap items-end gap-2 border-t border-slate-100 pt-4">
              <div className="min-w-[10rem] flex-1">
                <label className="block text-xs text-slate-600">Product</label>
                <select
                  value={line.product_id}
                  onChange={(e) => {
                    const v = e.target.value;
                    setManualLines((prev) => {
                      const next = [...prev];
                      next[idx] = { ...next[idx], product_id: v, option_id: "" };
                      return next;
                    });
                  }}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-2 text-sm"
                >
                  <option value="">—</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="min-w-[10rem] flex-1">
                <label className="block text-xs text-slate-600">Option</label>
                <select
                  value={line.option_id}
                  onChange={(e) => {
                    const v = e.target.value;
                    setManualLines((prev) => {
                      const next = [...prev];
                      next[idx] = { ...next[idx], option_id: v };
                      return next;
                    });
                  }}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-2 text-sm"
                >
                  <option value="">—</option>
                  {(products.find((p) => p.id === line.product_id)?.options ?? []).map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.label} (${o.unit_price.toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-24">
                <label className="block text-xs text-slate-600">Qty</label>
                <input
                  type="number"
                  min={1}
                  value={line.qty}
                  onChange={(e) => {
                    const q = Math.max(1, Number(e.target.value) || 1);
                    setManualLines((prev) => {
                      const next = [...prev];
                      next[idx] = { ...next[idx], qty: q };
                      return next;
                    });
                  }}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-2"
                />
              </div>
            </div>
          ))}
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              onClick={() =>
                setManualLines((prev) => [...prev, { product_id: "", option_id: "", qty: 1 }])
              }
            >
              Add line
            </button>
            <button
              type="submit"
              className="rounded-full bg-primary-600 px-6 py-2 font-semibold text-white"
            >
              Create manual order
            </button>
          </div>
        </form>
      </section>

      <section>
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-display text-xl font-semibold text-primary-800">All orders</h2>
          <button
            type="button"
            onClick={() => void refresh()}
            className="text-sm font-semibold text-primary-700 underline"
          >
            Refresh
          </button>
        </div>
        <div className="mt-4 overflow-x-auto rounded-xl bg-white ring-1 ring-slate-200">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-3 py-2">When</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Source</th>
                <th className="px-3 py-2">Customer</th>
                <th className="px-3 py-2">Total</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-slate-500">
                    Loading…
                  </td>
                </tr>
              )}
              {!loading &&
                orders.length === 0 &&
                !error && (
                  <tr>
                    <td colSpan={6} className="px-3 py-6 text-slate-500">
                      No orders yet. Web checkout orders appear here after customers complete checkout.
                    </td>
                  </tr>
                )}
              {!loading &&
                orders.map((o) => (
                  <tr key={o.id} className="border-t border-slate-100">
                    <td className="px-3 py-2 whitespace-nowrap text-slate-700">
                      {new Date(o.created_at).toLocaleString()}
                    </td>
                    <td className="px-3 py-2 font-medium">{o.status}</td>
                    <td className="px-3 py-2">{o.source}</td>
                    <td className="px-3 py-2">
                      {o.customer_name}
                      <br />
                      <span className="text-slate-500">{o.phone}</span>
                    </td>
                    <td className="px-3 py-2">${Number(o.subtotal).toFixed(2)}</td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        className="text-primary-600 underline"
                        onClick={() => setSelectedId(o.id === selectedId ? null : o.id)}
                      >
                        {selectedId === o.id ? "Close" : "Details"}
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>

      {selected && (
        <section
          className="rounded-2xl bg-white p-6 shadow-card ring-1 ring-slate-200"
          data-testid="order-detail"
        >
          <h3 className="font-semibold text-primary-800">Order {selected.id}</h3>
          <p className="mt-2 text-sm text-slate-600">
            Inventory applied: {selected.inventory_applied_at ? "yes" : "no"}
          </p>
          <ul className="mt-4 list-inside list-disc space-y-1 text-sm">
            {(itemsByOrder[selected.id] ?? []).map((it) => (
              <li key={it.id}>
                {it.title_snapshot} × {it.qty} @ ${Number(it.unit_price).toFixed(2)}
              </li>
            ))}
          </ul>
          <div className="mt-6 flex flex-wrap gap-2">
            {allowedNextStatuses(selected.status).map((next) => {
              if (mustUseConfirmOrder(selected.status, next)) {
                return (
                  <button
                    key={next}
                    type="button"
                    className="rounded-full bg-primary-600 px-4 py-2 text-sm font-semibold text-white"
                    onClick={() => void confirmOrder(selected.id)}
                  >
                    Confirm (deduct stock)
                  </button>
                );
              }
              return (
                <button
                  key={next}
                  type="button"
                  className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold"
                  onClick={() => void setStatus(selected.id, next)}
                >
                  Mark {next.replace("_", " ")}
                </button>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
