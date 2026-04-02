"use client";

import { createSupabaseAnonClient, hasSupabaseEnv } from "@/lib/supabase/client";
import { useCallback, useEffect, useState } from "react";

type IngredientRow = {
  id: string;
  name: string;
  track_unit: string;
  cost_per_unit: string | number;
  quantity_on_hand: string | number;
  low_stock_threshold: string | number | null;
};

const REASONS = [
  "purchase",
  "adjustment",
  "waste",
  "correction",
] as const;

export default function AdminInventoryPage() {
  const [rows, setRows] = useState<IngredientRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [adjId, setAdjId] = useState("");
  const [adjDelta, setAdjDelta] = useState("");
  const [adjReason, setAdjReason] = useState<(typeof REASONS)[number]>("adjustment");
  const [adjNotes, setAdjNotes] = useState("");

  const load = useCallback(async () => {
    if (!hasSupabaseEnv()) return;
    const supabase = createSupabaseAnonClient();
    const { data, error: qErr } = await supabase
      .from("ingredients")
      .select("*")
      .order("name");
    if (qErr) {
      setError(qErr.message);
      return;
    }
    setRows((data ?? []) as IngredientRow[]);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function submitAdjust(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!hasSupabaseEnv() || !adjId) return;
    const delta = Number(adjDelta);
    if (Number.isNaN(delta) || delta === 0) {
      setError("Enter a non-zero delta.");
      return;
    }
    const supabase = createSupabaseAnonClient();
    const { error: rpcErr } = await supabase.rpc("adjust_inventory", {
      p_ingredient_id: adjId,
      p_delta: delta,
      p_reason: adjReason,
      p_notes: adjNotes.trim() || null,
    });
    if (rpcErr) {
      setError(rpcErr.message);
      return;
    }
    setAdjDelta("");
    setAdjNotes("");
    await load();
  }

  if (!hasSupabaseEnv()) {
    return (
      <p className="rounded-xl bg-amber-50 p-4 text-amber-900">Configure Supabase.</p>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="font-display text-3xl font-bold text-primary-800">Inventory</h1>
      {error && (
        <p className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>
      )}

      <section className="rounded-2xl bg-white p-6 shadow-card ring-1 ring-slate-200">
        <h2 className="font-semibold text-primary-800">Adjustment</h2>
        <form onSubmit={(e) => void submitAdjust(e)} className="mt-4 flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs text-slate-600">Ingredient</label>
            <select
              value={adjId}
              onChange={(e) => setAdjId(e.target.value)}
              className="mt-1 rounded-lg border border-slate-300 px-2 py-2 text-sm"
            >
              <option value="">—</option>
              {rows.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.track_unit})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-600">Delta (+ / −)</label>
            <input
              value={adjDelta}
              onChange={(e) => setAdjDelta(e.target.value)}
              className="mt-1 w-28 rounded-lg border border-slate-300 px-2 py-2"
              placeholder="-2.5"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-600">Reason</label>
            <select
              value={adjReason}
              onChange={(e) => setAdjReason(e.target.value as (typeof REASONS)[number])}
              className="mt-1 rounded-lg border border-slate-300 px-2 py-2 text-sm"
            >
              {REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-[10rem] flex-1">
            <label className="block text-xs text-slate-600">Notes</label>
            <input
              value={adjNotes}
              onChange={(e) => setAdjNotes(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            className="rounded-full bg-primary-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Apply
          </button>
        </form>
      </section>

      <div className="overflow-x-auto rounded-xl bg-white ring-1 ring-slate-200">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Unit</th>
              <th className="px-3 py-2">On hand</th>
              <th className="px-3 py-2">Low threshold</th>
              <th className="px-3 py-2">Cost / unit</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-slate-100">
                <td className="px-3 py-2 font-medium">{r.name}</td>
                <td className="px-3 py-2">{r.track_unit}</td>
                <td className="px-3 py-2">{Number(r.quantity_on_hand).toFixed(3)}</td>
                <td className="px-3 py-2">
                  {r.low_stock_threshold != null ? Number(r.low_stock_threshold).toFixed(3) : "—"}
                </td>
                <td className="px-3 py-2">${Number(r.cost_per_unit).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
