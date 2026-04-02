"use client";

import { createSupabaseAnonClient, hasSupabaseEnv } from "@/lib/supabase/client";
import { useCallback, useEffect, useState } from "react";

type RecipeLine = {
  id: string;
  product_id: string;
  product_option_id: string | null;
  ingredient_id: string;
  amount_per_kg_finished_product: string | number;
};

type Ingredient = { id: string; name: string; track_unit: string };

export default function AdminRecipesPage() {
  const [lines, setLines] = useState<RecipeLine[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const load = useCallback(async () => {
    if (!hasSupabaseEnv()) return;
    const supabase = createSupabaseAnonClient();
    const [{ data: r }, { data: ing }] = await Promise.all([
      supabase.from("recipe_lines").select("*").order("product_id"),
      supabase.from("ingredients").select("id, name, track_unit").order("name"),
    ]);
    setLines((r ?? []) as RecipeLine[]);
    setIngredients((ing ?? []) as Ingredient[]);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const ingName = (id: string) => ingredients.find((i) => i.id === id)?.name ?? id;

  if (!hasSupabaseEnv()) {
    return (
      <p className="rounded-xl bg-amber-50 p-4 text-amber-900">Configure Supabase.</p>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold text-primary-800">Recipes (BOM)</h1>
      <p className="text-sm text-slate-600">
        Amounts are per 1 kg of finished product, in the ingredient&apos;s unit (kg or L).
      </p>
      <div className="overflow-x-auto rounded-xl bg-white ring-1 ring-slate-200">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-3 py-2">Product</th>
              <th className="px-3 py-2">Option</th>
              <th className="px-3 py-2">Ingredient</th>
              <th className="px-3 py-2">Amount / kg product</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((l) => (
              <tr key={l.id} className="border-t border-slate-100">
                <td className="px-3 py-2 font-mono text-xs">{l.product_id}</td>
                <td className="px-3 py-2">{l.product_option_id ?? "—"}</td>
                <td className="px-3 py-2">
                  {ingName(l.ingredient_id)}
                </td>
                <td className="px-3 py-2">
                  {Number(l.amount_per_kg_finished_product).toFixed(4)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-500">
        To edit BOM rows, use Supabase SQL or Table Editor for now; destructive edits should stay
        consistent with inventory rules.
      </p>
    </div>
  );
}
