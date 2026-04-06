"use client";

import { assignBakerForOrderItem, type BakerName } from "@/lib/admin/baker-assignment";
import { getStaffSupabase } from "@/lib/admin/staff-access";
import { hasSupabaseEnv } from "@/lib/supabase/client";
import { useCallback, useEffect, useMemo, useState } from "react";

type OrderRow = {
  id: string;
  status: "pending" | "confirmed" | "in_progress" | "ready" | "completed" | "cancelled";
  source: string;
  customer_name: string;
  phone: string;
  subtotal: string | number;
  created_at: string;
};

type OrderItemRow = {
  id: string;
  order_id: string;
  product_id: string;
  option_id: string | null;
  qty: number;
  title_snapshot: string;
};

type AssignedOrder = {
  order: OrderRow;
  items: OrderItemRow[];
};

const ACTIVE_STATUSES: OrderRow["status"][] = ["pending", "confirmed", "in_progress", "ready"];
const BAKERS: BakerName[] = ["Vicky", "Sonig"];

export default function AssignedOrdersPage() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [itemsByOrderId, setItemsByOrderId] = useState<Record<string, OrderItemRow[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAssignedOrders = useCallback(async () => {
    if (!hasSupabaseEnv()) return;
    setLoading(true);
    const access = await getStaffSupabase();
    if (!access.ok) {
      setError(access.message);
      setOrders([]);
      setItemsByOrderId({});
      setLoading(false);
      return;
    }

    const { supabase } = access;
    const { data: orderRows, error: orderError } = await supabase
      .from("orders")
      .select("id, status, source, customer_name, phone, subtotal, created_at")
      .in("status", ACTIVE_STATUSES)
      .order("created_at", { ascending: false })
      .limit(100);

    if (orderError) {
      setError(orderError.message);
      setLoading(false);
      return;
    }

    const parsedOrders = (orderRows ?? []) as OrderRow[];
    setOrders(parsedOrders);

    if (parsedOrders.length === 0) {
      setItemsByOrderId({});
      setError(null);
      setLoading(false);
      return;
    }

    const orderIds = parsedOrders.map((order) => order.id);
    const { data: itemRows, error: itemError } = await supabase
      .from("order_items")
      .select("id, order_id, product_id, option_id, qty, title_snapshot")
      .in("order_id", orderIds);

    if (itemError) {
      setError(itemError.message);
      setLoading(false);
      return;
    }

    const grouped: Record<string, OrderItemRow[]> = {};
    for (const row of (itemRows ?? []) as OrderItemRow[]) {
      if (!grouped[row.order_id]) grouped[row.order_id] = [];
      grouped[row.order_id].push(row);
    }

    setItemsByOrderId(grouped);
    setError(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadAssignedOrders();
  }, [loadAssignedOrders]);

  const assignedByBaker = useMemo(() => {
    const result: Record<BakerName, AssignedOrder[]> = {
      Vicky: [],
      Sonig: [],
    };

    for (const order of orders) {
      const items = itemsByOrderId[order.id] ?? [];
      const groupedItems: Record<BakerName, OrderItemRow[]> = {
        Vicky: [],
        Sonig: [],
      };

      for (const item of items) {
        const baker = assignBakerForOrderItem(item);
        groupedItems[baker].push(item);
      }

      for (const baker of BAKERS) {
        if (groupedItems[baker].length > 0) {
          result[baker].push({
            order,
            items: groupedItems[baker],
          });
        }
      }
    }

    return result;
  }, [orders, itemsByOrderId]);

  if (!hasSupabaseEnv()) {
    return (
      <p className="rounded-xl bg-amber-50 p-4 text-amber-900">
        Configure Supabase environment variables.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-primary-800">Assigned Orders</h1>
          <p className="mt-1 text-sm text-slate-600">
            Active order items split by baker without changing the original order flow.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadAssignedOrders()}
          className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
        >
          Refresh
        </button>
      </div>

      {error && (
        <p className="rounded-xl bg-red-50 p-3 text-sm text-red-800 ring-1 ring-red-200" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <p className="rounded-xl border border-slate-200 bg-white py-8 text-center text-slate-500 shadow-sm">
          Loading assigned orders…
        </p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {BAKERS.map((baker) => (
            <section key={baker} className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-slate-200">
              <h2 className="font-display text-2xl font-semibold text-primary-800">{baker}</h2>
              <p className="mt-1 text-xs text-slate-500">
                {assignedByBaker[baker].length} order
                {assignedByBaker[baker].length === 1 ? "" : "s"} with assigned tasks
              </p>

              {assignedByBaker[baker].length === 0 ? (
                <p className="mt-4 text-sm text-slate-600">No active items assigned right now.</p>
              ) : (
                <div className="mt-4 space-y-3">
                  {assignedByBaker[baker].map(({ order, items }) => (
                    <article key={`${baker}-${order.id}`} className="rounded-xl border border-slate-200 p-3">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {order.customer_name} <span className="text-slate-400">#{order.id.slice(0, 8)}</span>
                          </p>
                          <p className="text-xs text-slate-500">
                            {order.status.replaceAll("_", " ")} · {new Date(order.created_at).toLocaleString()}
                          </p>
                        </div>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                          {order.source}
                        </span>
                      </div>

                      <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-slate-800">
                        {items.map((item) => (
                          <li key={item.id}>
                            {item.title_snapshot} × {item.qty}
                          </li>
                        ))}
                      </ul>
                    </article>
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
