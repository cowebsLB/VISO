"use client";

import { getStaffSupabase } from "@/lib/admin/staff-access";
import { hasSupabaseEnv } from "@/lib/supabase/client";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function AdminDashboardPage() {
  const [pending, setPending] = useState<number | null>(null);
  const [lowStock, setLowStock] = useState<number | null>(null);
  const [staffError, setStaffError] = useState<string | null>(null);

  useEffect(() => {
    if (!hasSupabaseEnv()) return;
    void (async () => {
      const access = await getStaffSupabase();
      if (!access.ok) {
        setStaffError(access.message);
        setPending(0);
        setLowStock(0);
        return;
      }
      setStaffError(null);
      const { supabase } = access;
      const { count: p } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");
      setPending(p ?? 0);

      const { data: ing } = await supabase
        .from("ingredients")
        .select("id, quantity_on_hand, low_stock_threshold");
      let low = 0;
      for (const row of ing ?? []) {
        const th = row.low_stock_threshold;
        if (th != null && Number(row.quantity_on_hand) < Number(th)) low += 1;
      }
      setLowStock(low);
    })();
  }, []);

  if (!hasSupabaseEnv()) {
    return (
      <p className="rounded-xl bg-amber-50 p-4 text-amber-900">
        Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to use the admin dashboard.
      </p>
    );
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-primary-800">Dashboard</h1>
      {staffError && (
        <p className="mt-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-950 ring-1 ring-amber-200" role="alert">
          {staffError}
        </p>
      )}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/admin/orders"
          className="rounded-2xl bg-white p-6 shadow-card ring-1 ring-slate-200 transition hover:ring-primary-300"
        >
          <p className="text-sm font-medium text-slate-600">Pending orders</p>
          <p className="mt-2 text-3xl font-bold text-primary-700" data-testid="dash-pending">
            {pending === null ? "…" : pending}
          </p>
        </Link>
        <Link
          href="/admin/inventory"
          className="rounded-2xl bg-white p-6 shadow-card ring-1 ring-slate-200 transition hover:ring-primary-300"
        >
          <p className="text-sm font-medium text-slate-600">Low-stock ingredients</p>
          <p className="mt-2 text-3xl font-bold text-amber-700" data-testid="dash-low-stock">
            {lowStock === null ? "…" : lowStock}
          </p>
        </Link>
        <Link
          href="/admin/orders"
          className="rounded-2xl bg-white p-6 shadow-card ring-1 ring-slate-200 transition hover:ring-primary-300"
        >
          <p className="text-sm font-medium text-slate-600">Orders & production</p>
          <p className="mt-2 text-sm text-slate-700">Open orders to confirm, advance status, or add manual orders.</p>
        </Link>
      </div>
    </div>
  );
}
