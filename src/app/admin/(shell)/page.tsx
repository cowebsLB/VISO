"use client";

import { getStaffSupabase } from "@/lib/admin/staff-access";
import { hasSupabaseEnv } from "@/lib/supabase/client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type IngredientRow = {
  id: string;
  name: string;
  quantity_on_hand: string | number;
  low_stock_threshold: string | number | null;
};

type OrderRow = {
  id: string;
  customer_name: string;
  status: "pending" | "confirmed" | "in_progress" | "ready" | "completed" | "cancelled";
  subtotal: string | number;
  created_at: string;
};

type DashboardStats = {
  pending: number;
  inProgress: number;
  ready: number;
  completedToday: number;
  lowStock: number;
  outOfStock: number;
  trackedIngredients: number;
  ordersToday: number;
  salesToday: number;
  avgOrderValueToday: number;
};

const card =
  "rounded-2xl bg-white p-5 shadow-card ring-1 ring-slate-200 transition hover:ring-primary-300";

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [lowStockRows, setLowStockRows] = useState<IngredientRow[]>([]);
  const [recentOrders, setRecentOrders] = useState<OrderRow[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [staffError, setStaffError] = useState<string | null>(null);

  useEffect(() => {
    if (!hasSupabaseEnv()) return;
    void (async () => {
      const access = await getStaffSupabase();
      if (!access.ok) {
        setStaffError(access.message);
        setStats({
          pending: 0,
          inProgress: 0,
          ready: 0,
          completedToday: 0,
          lowStock: 0,
          outOfStock: 0,
          trackedIngredients: 0,
          ordersToday: 0,
          salesToday: 0,
          avgOrderValueToday: 0,
        });
        setLowStockRows([]);
        setRecentOrders([]);
        return;
      }

      setStaffError(null);
      setLoadError(null);
      const { supabase } = access;

      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const startIso = startOfDay.toISOString();

      const [
        { count: pendingCount, error: pendingErr },
        { count: inProgressCount, error: inProgressErr },
        { count: readyCount, error: readyErr },
        { data: ingredients, error: ingredientsErr },
        { data: todayOrders, error: todayOrdersErr },
        { data: latestOrders, error: latestErr },
      ] = await Promise.all([
        supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", "in_progress"),
        supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", "ready"),
        supabase.from("ingredients").select("id, name, quantity_on_hand, low_stock_threshold").order("name"),
        supabase.from("orders").select("id, status, subtotal, created_at").gte("created_at", startIso),
        supabase
          .from("orders")
          .select("id, customer_name, status, subtotal, created_at")
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

      const qErr =
        pendingErr ?? inProgressErr ?? readyErr ?? ingredientsErr ?? todayOrdersErr ?? latestErr;
      if (qErr) {
        setLoadError(qErr.message);
        return;
      }

      const ingredientRows = (ingredients ?? []) as IngredientRow[];
      const lowRows = ingredientRows
        .filter((row) => {
          const threshold = row.low_stock_threshold;
          if (threshold == null) return false;
          return Number(row.quantity_on_hand) < Number(threshold);
        })
        .sort((a, b) => {
          const aGap = Number(a.low_stock_threshold ?? 0) - Number(a.quantity_on_hand);
          const bGap = Number(b.low_stock_threshold ?? 0) - Number(b.quantity_on_hand);
          return bGap - aGap;
        });

      const outOfStockCount = ingredientRows.filter((row) => Number(row.quantity_on_hand) <= 0).length;

      const todays = (todayOrders ?? []) as Array<Pick<OrderRow, "status" | "subtotal">>;
      const todaysActive = todays.filter((o) => o.status !== "cancelled");
      const completedToday = todays.filter((o) => o.status === "completed").length;
      const salesToday = todaysActive.reduce((sum, o) => sum + Number(o.subtotal), 0);
      const ordersToday = todaysActive.length;
      const avgOrderValueToday = ordersToday > 0 ? salesToday / ordersToday : 0;

      setStats({
        pending: pendingCount ?? 0,
        inProgress: inProgressCount ?? 0,
        ready: readyCount ?? 0,
        completedToday,
        lowStock: lowRows.length,
        outOfStock: outOfStockCount,
        trackedIngredients: ingredientRows.length,
        ordersToday,
        salesToday,
        avgOrderValueToday,
      });

      setLowStockRows(lowRows.slice(0, 5));
      setRecentOrders((latestOrders ?? []) as OrderRow[]);
    })();
  }, []);

  const loading = stats == null && !staffError;
  const latestOrdersData = useMemo(() => recentOrders, [recentOrders]);

  if (!hasSupabaseEnv()) {
    return (
      <p className="rounded-xl bg-amber-50 p-4 text-amber-900">
        Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to use the admin dashboard.
      </p>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-primary-800">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-600">
            Today&apos;s operations, inventory health, and recent activity.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/orders" className={card + " !p-3 text-sm font-semibold text-slate-800"}>
            + Manual order
          </Link>
          <Link href="/admin/inventory" className={card + " !p-3 text-sm font-semibold text-slate-800"}>
            + Add ingredient
          </Link>
          <Link href="/admin/recipes" className={card + " !p-3 text-sm font-semibold text-slate-800"}>
            + Add recipe line
          </Link>
        </div>
      </div>

      {staffError && (
        <p className="mt-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-950 ring-1 ring-amber-200" role="alert">
          {staffError}
        </p>
      )}
      {loadError && (
        <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">
          {loadError}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          href="/admin/orders"
          className={card}
        >
          <p className="text-sm font-medium text-slate-600">Pending</p>
          <p className="mt-2 text-3xl font-bold text-primary-700" data-testid="dash-pending">
            {loading ? "…" : (stats?.pending ?? 0)}
          </p>
        </Link>
        <Link href="/admin/orders" className={card}>
          <p className="text-sm font-medium text-slate-600">In progress</p>
          <p className="mt-2 text-3xl font-bold text-indigo-700">{loading ? "…" : (stats?.inProgress ?? 0)}</p>
        </Link>
        <Link href="/admin/orders" className={card}>
          <p className="text-sm font-medium text-slate-600">Ready</p>
          <p className="mt-2 text-3xl font-bold text-emerald-700">{loading ? "…" : (stats?.ready ?? 0)}</p>
        </Link>
        <Link href="/admin/orders" className={card}>
          <p className="text-sm font-medium text-slate-600">Completed today</p>
          <p className="mt-2 text-3xl font-bold text-slate-800">{loading ? "…" : (stats?.completedToday ?? 0)}</p>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link href="/admin/inventory" className={card}>
          <p className="text-sm font-medium text-slate-600">Low-stock ingredients</p>
          <p className="mt-2 text-3xl font-bold text-amber-700" data-testid="dash-low-stock">
            {loading ? "…" : (stats?.lowStock ?? 0)}
          </p>
        </Link>
        <Link
          href="/admin/inventory"
          className={card}
        >
          <p className="text-sm font-medium text-slate-600">Out-of-stock ingredients</p>
          <p className="mt-2 text-3xl font-bold text-red-700">{loading ? "…" : (stats?.outOfStock ?? 0)}</p>
        </Link>
        <Link href="/admin/inventory" className={card}>
          <p className="text-sm font-medium text-slate-600">Tracked ingredients</p>
          <p className="mt-2 text-3xl font-bold text-slate-800">
            {loading ? "…" : (stats?.trackedIngredients ?? 0)}
          </p>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/admin/orders"
          className={card}
        >
          <p className="text-sm font-medium text-slate-600">Orders today</p>
          <p className="mt-2 text-3xl font-bold text-slate-800">{loading ? "…" : (stats?.ordersToday ?? 0)}</p>
        </Link>
        <Link href="/admin/orders" className={card}>
          <p className="text-sm font-medium text-slate-600">Sales today</p>
          <p className="mt-2 text-3xl font-bold text-primary-700">
            {loading ? "…" : money.format(stats?.salesToday ?? 0)}
          </p>
        </Link>
        <Link href="/admin/orders" className={card}>
          <p className="text-sm font-medium text-slate-600">Avg order value today</p>
          <p className="mt-2 text-3xl font-bold text-slate-800">
            {loading ? "…" : money.format(stats?.avgOrderValueToday ?? 0)}
          </p>
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-slate-200">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Most urgent low-stock</h2>
            <Link href="/admin/inventory" className="text-sm font-semibold text-primary-700 hover:underline">
              Open inventory
            </Link>
          </div>
          {lowStockRows.length === 0 ? (
            <p className="text-sm text-slate-600">No low-stock ingredients right now.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {lowStockRows.map((row) => (
                <li key={row.id} className="flex items-center justify-between py-2">
                  <span className="text-sm font-medium text-slate-800">{row.name}</span>
                  <span className="text-sm text-slate-600">
                    {Number(row.quantity_on_hand).toFixed(3)} / {Number(row.low_stock_threshold).toFixed(3)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-slate-200">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Recent orders</h2>
            <Link href="/admin/orders" className="text-sm font-semibold text-primary-700 hover:underline">
              View all
            </Link>
          </div>
          {latestOrdersData.length === 0 ? (
            <p className="text-sm text-slate-600">No orders yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {latestOrdersData.map((o) => (
                <li key={o.id} className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      {o.customer_name} <span className="text-slate-400">#{o.id.slice(0, 8)}</span>
                    </p>
                    <p className="text-xs text-slate-500">
                      {o.status.replaceAll("_", " ")} · {new Date(o.created_at).toLocaleString()}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-slate-700">{money.format(Number(o.subtotal))}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
