"use client";

import { createSupabaseAnonClient, hasSupabaseEnv } from "@/lib/supabase/client";
import { useCallback, useEffect, useState } from "react";

type ProductRow = {
  id: string;
  is_active: boolean;
  weight_per_sale_unit_kg: string | number;
  image_path: string | null;
};

type CategoryRow = { id: string; slug: string };

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [newId, setNewId] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newWeight, setNewWeight] = useState("1");

  const load = useCallback(async () => {
    if (!hasSupabaseEnv()) return;
    const supabase = createSupabaseAnonClient();
    const [{ data: p }, { data: c }] = await Promise.all([
      supabase.from("products").select("*").order("id"),
      supabase.from("product_categories").select("id, slug").order("sort_order"),
    ]);
    setProducts((p ?? []) as ProductRow[]);
    setCategories((c ?? []) as CategoryRow[]);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function saveRow(row: ProductRow, patch: Partial<ProductRow>) {
    setError(null);
    if (!hasSupabaseEnv()) return;
    const supabase = createSupabaseAnonClient();
    const { error: uErr } = await supabase
      .from("products")
      .update({
        ...patch,
        weight_per_sale_unit_kg:
          patch.weight_per_sale_unit_kg ?? row.weight_per_sale_unit_kg,
      })
      .eq("id", row.id);
    if (uErr) {
      setError(uErr.message);
      return;
    }
    await load();
  }

  async function createProduct(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!hasSupabaseEnv()) return;
    const id = newId.trim().toLowerCase().replace(/\s+/g, "-");
    if (!id || !newCategory) {
      setError("Slug and category required.");
      return;
    }
    const supabase = createSupabaseAnonClient();
    const { error: ins } = await supabase.from("products").insert({
      id,
      category_id: newCategory,
      is_active: true,
      weight_per_sale_unit_kg: Number(newWeight) || 1,
      image_path: null,
    });
    if (ins) {
      setError(ins.message);
      return;
    }
    await supabase.from("product_i18n").insert([
      { product_id: id, locale: "en", name: id, description: "" },
      { product_id: id, locale: "ar", name: id, description: "" },
      { product_id: id, locale: "hy", name: id, description: "" },
    ]);
    setNewId("");
    await load();
  }

  if (!hasSupabaseEnv()) {
    return (
      <p className="rounded-xl bg-amber-50 p-4 text-amber-900">Configure Supabase.</p>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="font-display text-3xl font-bold text-primary-800">Products</h1>
      {error && (
        <p className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>
      )}

      <section className="rounded-2xl bg-white p-6 shadow-card ring-1 ring-slate-200">
        <h2 className="font-semibold text-primary-800">Add product (slug)</h2>
        <p className="mt-1 text-sm text-slate-600">
          New URLs require a site rebuild for static export. Add i18n names in Supabase or here after
          insert.
        </p>
        <form onSubmit={(e) => void createProduct(e)} className="mt-4 flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs text-slate-600">Slug (id)</label>
            <input
              value={newId}
              onChange={(e) => setNewId(e.target.value)}
              className="mt-1 rounded-lg border border-slate-300 px-2 py-2"
              placeholder="new-item"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-600">Category</label>
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="mt-1 rounded-lg border border-slate-300 px-2 py-2"
            >
              <option value="">—</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.slug}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-600">Weight / sale unit (kg)</label>
            <input
              value={newWeight}
              onChange={(e) => setNewWeight(e.target.value)}
              className="mt-1 w-28 rounded-lg border border-slate-300 px-2 py-2"
              type="number"
              step="0.01"
              min="0.01"
            />
          </div>
          <button type="submit" className="rounded-full bg-primary-600 px-4 py-2 text-sm font-semibold text-white">
            Add
          </button>
        </form>
      </section>

      <div className="overflow-x-auto rounded-xl bg-white ring-1 ring-slate-200">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-3 py-2">ID</th>
              <th className="px-3 py-2">Active</th>
              <th className="px-3 py-2">Weight (kg / unit)</th>
              <th className="px-3 py-2">Image path</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {products.map((row) => (
              <tr key={row.id} className="border-t border-slate-100">
                <td className="px-3 py-2 font-mono text-xs">{row.id}</td>
                <td className="px-3 py-2">
                  <input
                    type="checkbox"
                    checked={row.is_active}
                    onChange={(e) => void saveRow(row, { is_active: e.target.checked })}
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    defaultValue={Number(row.weight_per_sale_unit_kg)}
                    className="w-24 rounded border border-slate-300 px-2 py-1"
                    onBlur={(e) =>
                      void saveRow(row, {
                        weight_per_sale_unit_kg: Number(e.target.value) || 1,
                      })
                    }
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    defaultValue={row.image_path ?? ""}
                    className="min-w-[12rem] rounded border border-slate-300 px-2 py-1 text-xs"
                    onBlur={(e) =>
                      void saveRow(row, { image_path: e.target.value || null })
                    }
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
