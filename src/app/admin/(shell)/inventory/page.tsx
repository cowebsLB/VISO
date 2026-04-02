"use client";

import { getStaffSupabase } from "@/lib/admin/staff-access";
import { hasSupabaseEnv } from "@/lib/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useCallback, useEffect, useState } from "react";

type IngredientRow = {
  id: string;
  name: string;
  category: string | null;
  track_unit: "kg" | "L";
  cost_per_unit: string | number;
  quantity_on_hand: string | number;
  low_stock_threshold: string | number | null;
};

type TxReason = "purchase" | "adjustment" | "waste" | "correction";

const STOCK_REASONS: { value: TxReason; label: string }[] = [
  { value: "purchase", label: "Delivery or purchase" },
  { value: "waste", label: "Used, spoiled, or wasted" },
  { value: "correction", label: "Count correction" },
  { value: "adjustment", label: "Other" },
];

const btnSecondary =
  "rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-800 hover:bg-slate-50";
const btnPrimary =
  "rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50";
const btnDanger =
  "rounded-lg border border-red-300 bg-white px-3 py-1.5 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50";

export default function AdminInventoryPage() {
  const [rows, setRows] = useState<IngredientRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [staffError, setStaffError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [dialog, setDialog] = useState<
    | null
    | { type: "add" }
    | { type: "edit"; row: IngredientRow }
    | { type: "stock"; row: IngredientRow }
  >(null);

  const load = useCallback(async () => {
    if (!hasSupabaseEnv()) return;
    setStaffError(null);
    const access = await getStaffSupabase();
    if (!access.ok) {
      setStaffError(access.message);
      setRows([]);
      return;
    }
    const { supabase } = access;
    const { data, error: qErr } = await supabase.from("ingredients").select("*").order("name");
    if (qErr) {
      setError(qErr.message);
      return;
    }
    setError(null);
    setRows((data ?? []) as IngredientRow[]);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  /** Runs fn with a staff Supabase client. Returns outcome for control flow. */
  async function withStaff(
    fn: (supabase: SupabaseClient) => Promise<{ error: { message: string } | null }>,
  ): Promise<"ok" | "staff" | "fail"> {
    setError(null);
    const access = await getStaffSupabase();
    if (!access.ok) {
      setStaffError(access.message);
      return "staff";
    }
    const { error } = await fn(access.supabase);
    if (error) {
      const msg = error.message;
      setError(
        msg.includes("foreign key") || msg.includes("violates")
          ? `${msg} — This ingredient may still be linked to a recipe. Remove it from Recipes first.`
          : msg,
      );
      return "fail";
    }
    return "ok";
  }

  async function handleDelete(row: IngredientRow) {
    if (!window.confirm(`Remove “${row.name}” from ingredients? This only works if it is not used in any recipe.`)) {
      return;
    }
    setBusy(true);
    try {
      const r = await withStaff(async (supabase) => {
        const { error } = await supabase.from("ingredients").delete().eq("id", row.id);
        return { error };
      });
      if (r === "ok") await load();
    } finally {
      setBusy(false);
    }
  }

  if (!hasSupabaseEnv()) {
    return (
      <p className="rounded-xl bg-amber-50 p-4 text-amber-900">Connect Supabase to manage inventory.</p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-primary-800">Inventory</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">
            Track raw materials (flour, butter, …). Use <strong>Add ingredient</strong> for new items. Use{" "}
            <strong>Edit</strong> to change name, unit, cost, or low-stock alert. Use{" "}
            <strong>Update stock</strong> when you buy or use stock—confirmed orders can also reduce quantities from
            the Orders page.
          </p>
        </div>
        <button
          type="button"
          disabled={!!staffError}
          onClick={() => {
            setError(null);
            setDialog({ type: "add" });
          }}
          className="shrink-0 rounded-full bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
        >
          Add ingredient
        </button>
      </div>

      {staffError && (
        <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-950 ring-1 ring-amber-200">{staffError}</p>
      )}
      {error && (
        <p className="rounded-xl bg-red-50 p-3 text-sm text-red-800" role="alert">
          {error}
        </p>
      )}

      <div className="overflow-x-auto rounded-xl bg-white shadow-card ring-1 ring-slate-200">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-3 py-2 font-semibold">Name</th>
              <th className="px-3 py-2 font-semibold">Unit</th>
              <th className="px-3 py-2 font-semibold">On hand</th>
              <th className="px-3 py-2 font-semibold">Low alert</th>
              <th className="px-3 py-2 font-semibold">Cost / unit</th>
              <th className="px-3 py-2 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && !staffError ? (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-slate-500">
                  No ingredients yet. Click <strong>Add ingredient</strong>.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-t border-slate-100">
                  <td className="px-3 py-2 font-medium text-slate-900">{r.name}</td>
                  <td className="px-3 py-2">{r.track_unit}</td>
                  <td className="px-3 py-2 tabular-nums">{Number(r.quantity_on_hand).toFixed(3)}</td>
                  <td className="px-3 py-2 tabular-nums">
                    {r.low_stock_threshold != null ? Number(r.low_stock_threshold).toFixed(3) : "—"}
                  </td>
                  <td className="px-3 py-2 tabular-nums">${Number(r.cost_per_unit).toFixed(2)}</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={busy}
                        className={btnSecondary}
                        onClick={() => {
                          setError(null);
                          setDialog({ type: "stock", row: r });
                        }}
                      >
                        Update stock
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        className={btnSecondary}
                        onClick={() => {
                          setError(null);
                          setDialog({ type: "edit", row: r });
                        }}
                      >
                        Edit
                      </button>
                      <button type="button" disabled={busy} className={btnDanger} onClick={() => void handleDelete(r)}>
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {dialog?.type === "add" && (
        <IngredientFormModal
          title="Add ingredient"
          initial={null}
          busy={busy}
          onClose={() => setDialog(null)}
          onSave={async (payload) => {
            setBusy(true);
            try {
              const r = await withStaff(async (supabase) => {
                const { error } = await supabase.from("ingredients").insert({
                  name: payload.name.trim(),
                  category: payload.category.trim() || null,
                  track_unit: payload.track_unit,
                  cost_per_unit: payload.cost_per_unit,
                  quantity_on_hand: payload.quantity_on_hand,
                  low_stock_threshold: payload.low_stock_threshold,
                });
                return { error };
              });
              if (r === "ok") {
                setDialog(null);
                await load();
              }
            } finally {
              setBusy(false);
            }
          }}
        />
      )}

      {dialog?.type === "edit" && (
        <IngredientFormModal
          title="Edit ingredient"
          initial={dialog.row}
          busy={busy}
          onClose={() => setDialog(null)}
          onSave={async (payload) => {
            setBusy(true);
            try {
              const r = await withStaff(async (supabase) => {
                const { error } = await supabase
                  .from("ingredients")
                  .update({
                    name: payload.name.trim(),
                    category: payload.category.trim() || null,
                    track_unit: payload.track_unit,
                    cost_per_unit: payload.cost_per_unit,
                    low_stock_threshold: payload.low_stock_threshold,
                  })
                  .eq("id", dialog.row.id);
                return { error };
              });
              if (r === "ok") {
                setDialog(null);
                await load();
              }
            } finally {
              setBusy(false);
            }
          }}
        />
      )}

      {dialog?.type === "stock" && (
        <StockModal
          row={dialog.row}
          busy={busy}
          onClose={() => setDialog(null)}
          onApply={async (delta, reason, notes) => {
            setBusy(true);
            try {
              const r = await withStaff(async (supabase) => {
                const { error } = await supabase.rpc("adjust_inventory", {
                  p_ingredient_id: dialog.row.id,
                  p_delta: delta,
                  p_reason: reason,
                  p_notes: notes.trim() || null,
                });
                return { error };
              });
              if (r === "ok") {
                setDialog(null);
                await load();
              }
            } finally {
              setBusy(false);
            }
          }}
        />
      )}
    </div>
  );
}

type FormPayload = {
  name: string;
  category: string;
  track_unit: "kg" | "L";
  cost_per_unit: number;
  quantity_on_hand: number;
  low_stock_threshold: number | null;
};

function IngredientFormModal({
  title,
  initial,
  busy,
  onClose,
  onSave,
}: {
  title: string;
  initial: IngredientRow | null;
  busy: boolean;
  onClose: () => void;
  onSave: (p: FormPayload) => void | Promise<void>;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [trackUnit, setTrackUnit] = useState<"kg" | "L">(initial?.track_unit ?? "kg");
  const [cost, setCost] = useState(initial ? String(initial.cost_per_unit) : "");
  const [qty, setQty] = useState(initial ? String(initial.quantity_on_hand) : "0");
  const [low, setLow] = useState(initial?.low_stock_threshold != null ? String(initial.low_stock_threshold) : "");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const costN = Number(cost);
    const lowN = low.trim() === "" ? null : Number(low);
    if (!name.trim()) return;
    if (Number.isNaN(costN) || costN < 0) return;
    if (initial == null) {
      const qtyN = Number(qty);
      if (Number.isNaN(qtyN)) return;
      await onSave({
        name,
        category,
        track_unit: trackUnit,
        cost_per_unit: costN,
        quantity_on_hand: qtyN,
        low_stock_threshold: lowN != null && !Number.isNaN(lowN) ? lowN : null,
      });
    } else {
      await onSave({
        name,
        category,
        track_unit: trackUnit,
        cost_per_unit: costN,
        quantity_on_hand: Number(initial.quantity_on_hand),
        low_stock_threshold: lowN != null && !Number.isNaN(lowN) ? lowN : null,
      });
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="inv-modal-title"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="inv-modal-title" className="font-display text-xl font-bold text-primary-800">
          {title}
        </h2>
        {initial && (
          <p className="mt-1 text-sm text-slate-500">
            Current stock:{" "}
            <strong className="text-slate-800">
              {Number(initial.quantity_on_hand).toFixed(3)} {initial.track_unit}
            </strong>{" "}
            — change it with <strong>Update stock</strong> on the list, not here.
          </p>
        )}
        <form onSubmit={(e) => void submit(e)} className="mt-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              required
              placeholder="e.g. Butter"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Category (optional)</label>
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              placeholder="e.g. Dairy"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Unit</label>
            <select
              value={trackUnit}
              onChange={(e) => setTrackUnit(e.target.value as "kg" | "L")}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            >
              <option value="kg">kg</option>
              <option value="L">L (liters)</option>
            </select>
          </div>
          {initial == null && (
            <div>
              <label className="block text-sm font-medium text-slate-700">Starting amount</label>
              <input
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                type="number"
                step="0.001"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
              <p className="mt-0.5 text-xs text-slate-500">How much you have now (you can fix later with Update stock).</p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700">Cost per unit ($)</label>
            <input
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              type="number"
              step="0.01"
              min="0"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Low stock alert (optional)</label>
            <input
              value={low}
              onChange={(e) => setLow(e.target.value)}
              type="number"
              step="0.001"
              min="0"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              placeholder="Warn when below this amount"
            />
          </div>
          <div className="flex flex-wrap justify-end gap-2 pt-2">
            <button type="button" className={btnSecondary} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" disabled={busy} className={btnPrimary}>
              {busy ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function StockModal({
  row,
  busy,
  onClose,
  onApply,
}: {
  row: IngredientRow;
  busy: boolean;
  onClose: () => void;
  onApply: (delta: number, reason: TxReason, notes: string) => void | Promise<void>;
}) {
  const [direction, setDirection] = useState<"in" | "out">("in");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState<TxReason>("purchase");
  const [notes, setNotes] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const n = Number(amount);
    if (Number.isNaN(n) || n <= 0) return;
    const delta = direction === "in" ? n : -n;
    let r = reason;
    if (direction === "in" && r === "waste") r = "purchase";
    if (direction === "out" && r === "purchase") r = "waste";
    await onApply(delta, r, notes);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="stock-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="stock-modal-title" className="font-display text-xl font-bold text-primary-800">
          Update stock
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          <strong>{row.name}</strong> — now {Number(row.quantity_on_hand).toFixed(3)} {row.track_unit}
        </p>
        <form onSubmit={(e) => void submit(e)} className="mt-4 space-y-3">
          <div className="flex gap-2">
            <button
              type="button"
              className={`flex-1 rounded-lg border px-3 py-2 text-sm font-semibold ${
                direction === "in"
                  ? "border-primary-600 bg-primary-50 text-primary-800"
                  : "border-slate-300 bg-white text-slate-700"
              }`}
              onClick={() => {
                setDirection("in");
                setReason("purchase");
              }}
            >
              Stock in
            </button>
            <button
              type="button"
              className={`flex-1 rounded-lg border px-3 py-2 text-sm font-semibold ${
                direction === "out"
                  ? "border-primary-600 bg-primary-50 text-primary-800"
                  : "border-slate-300 bg-white text-slate-700"
              }`}
              onClick={() => {
                setDirection("out");
                setReason("waste");
              }}
            >
              Stock out
            </button>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Amount ({row.track_unit})</label>
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              type="number"
              step="0.001"
              min="0.001"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              required
              placeholder="e.g. 5"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Reason</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as TxReason)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            >
              {STOCK_REASONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Notes (optional)</label>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </div>
          <div className="flex flex-wrap justify-end gap-2 pt-2">
            <button type="button" className={btnSecondary} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" disabled={busy} className={btnPrimary}>
              {busy ? "Applying…" : "Apply"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
