"use client";

import { getStaffSupabase } from "@/lib/admin/staff-access";
import { hasSupabaseEnv } from "@/lib/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useCallback, useEffect, useMemo, useState } from "react";

const DISPLAY_LOCALE = "en";

const btnSecondary =
  "rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-800 hover:bg-slate-50";
const btnPrimary =
  "rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50";
const btnDanger =
  "rounded-lg border border-red-300 bg-white px-3 py-1.5 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50";

type RecipeLine = {
  id: string;
  product_id: string;
  product_option_id: string | null;
  ingredient_id: string;
  amount_per_kg_finished_product: string | number;
};

type Ingredient = { id: string; name: string; track_unit: string };

type ProductI18n = { product_id: string; name: string };
type OptionI18n = { product_id: string; option_id: string; name: string };
type ProductOption = { product_id: string; id: string; sort_order: number };

const SHARED_OPTION_VALUE = "__shared__";

function formatAmountPerKg(value: string | number): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return String(value);
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  }).format(n);
}

function formatSaveError(msg: string): string {
  if (msg.includes("recipe_lines_unique_bom") || msg.includes("duplicate key")) {
    return "That product + variant already has this ingredient. Edit the existing row or pick another ingredient.";
  }
  return msg;
}

export default function AdminRecipesPage() {
  const [lines, setLines] = useState<RecipeLine[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [allProductIds, setAllProductIds] = useState<string[]>([]);
  const [productOptionsRows, setProductOptionsRows] = useState<ProductOption[]>([]);
  const [productNames, setProductNames] = useState<Map<string, string>>(() => new Map());
  const [optionNames, setOptionNames] = useState<Map<string, string>>(() => new Map());
  const [optionOrder, setOptionOrder] = useState<Map<string, number>>(() => new Map());
  const [error, setError] = useState<string | null>(null);
  const [staffError, setStaffError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [dialog, setDialog] = useState<null | { type: "add" } | { type: "edit"; line: RecipeLine }>(null);

  const load = useCallback(async () => {
    if (!hasSupabaseEnv()) return;
    setStaffError(null);
    setError(null);
    const access = await getStaffSupabase();
    if (!access.ok) {
      setStaffError(access.message);
      setLines([]);
      setIngredients([]);
      setAllProductIds([]);
      setProductOptionsRows([]);
      setProductNames(new Map());
      setOptionNames(new Map());
      setOptionOrder(new Map());
      return;
    }
    const { supabase } = access;

    const [
      { data: r, error: e1 },
      { data: ing, error: e2 },
      { data: pi, error: e3 },
      { data: oi, error: e4 },
      { data: po, error: e5 },
      { data: prodRows, error: e6 },
    ] = await Promise.all([
      supabase.from("recipe_lines").select("*").order("product_id"),
      supabase.from("ingredients").select("id, name, track_unit").order("name"),
      supabase.from("product_i18n").select("product_id, name").eq("locale", DISPLAY_LOCALE),
      supabase.from("product_option_i18n").select("product_id, option_id, name").eq("locale", DISPLAY_LOCALE),
      supabase.from("product_options").select("product_id, id, sort_order"),
      supabase.from("products").select("id").order("id"),
    ]);

    const err = e1 ?? e2 ?? e3 ?? e4 ?? e5 ?? e6;
    if (err) {
      setError(err.message);
      return;
    }

    setLines((r ?? []) as RecipeLine[]);
    setIngredients((ing ?? []) as Ingredient[]);
    setProductOptionsRows((po ?? []) as ProductOption[]);
    setAllProductIds((prodRows ?? []).map((p: { id: string }) => p.id));

    const pn = new Map<string, string>();
    for (const row of (pi ?? []) as ProductI18n[]) {
      pn.set(row.product_id, row.name);
    }
    setProductNames(pn);

    const on = new Map<string, string>();
    for (const row of (oi ?? []) as OptionI18n[]) {
      on.set(`${row.product_id}\0${row.option_id}`, row.name);
    }
    setOptionNames(on);

    const oo = new Map<string, number>();
    for (const row of (po ?? []) as ProductOption[]) {
      oo.set(`${row.product_id}\0${row.id}`, row.sort_order);
    }
    setOptionOrder(oo);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function withStaff(
    fn: (supabase: SupabaseClient) => Promise<{ error: { message: string } | null }>,
  ): Promise<"ok" | "staff" | "fail"> {
    setError(null);
    const access = await getStaffSupabase();
    if (!access.ok) {
      setStaffError(access.message);
      return "staff";
    }
    const { error: fnErr } = await fn(access.supabase);
    if (fnErr) {
      setError(formatSaveError(fnErr.message));
      return "fail";
    }
    return "ok";
  }

  const ingById = useMemo(() => {
    const m = new Map<string, Ingredient>();
    for (const i of ingredients) m.set(i.id, i);
    return m;
  }, [ingredients]);

  const productLabel = useCallback((id: string) => productNames.get(id) ?? id, [productNames]);
  const optionLabel = useCallback(
    (productId: string, optionId: string | null) => {
      if (optionId == null) return "Shared (all variants)";
      return optionNames.get(`${productId}\0${optionId}`) ?? optionId;
    },
    [optionNames],
  );

  const sortedProductIds = useMemo(() => {
    return [...allProductIds].sort((a, b) => {
      const cmp = productLabel(a).localeCompare(productLabel(b), undefined, { sensitivity: "base" });
      return cmp !== 0 ? cmp : a.localeCompare(b);
    });
  }, [allProductIds, productLabel]);

  const grouped = useMemo(() => {
    const optionSort = (productId: string, optionId: string | null) => {
      if (optionId == null) return -1;
      return optionOrder.get(`${productId}\0${optionId}`) ?? 0;
    };

    const productIds = [...new Set(lines.map((l) => l.product_id))].sort((a, b) => {
      const cmp = productLabel(a).localeCompare(productLabel(b), undefined, { sensitivity: "base" });
      return cmp !== 0 ? cmp : a.localeCompare(b);
    });

    return productIds.map((productId) => {
      const productLines = lines.filter((l) => l.product_id === productId);
      const optionKeys = [...new Set(productLines.map((l) => l.product_option_id ?? ""))].sort((oa, ob) => {
        const aId = oa === "" ? null : oa;
        const bId = ob === "" ? null : ob;
        const so = optionSort(productId, aId) - optionSort(productId, bId);
        if (so !== 0) return so;
        return optionLabel(productId, aId).localeCompare(optionLabel(productId, bId), undefined, {
          sensitivity: "base",
        });
      });

      const variants = optionKeys.map((key) => {
        const optionId = key === "" ? null : key;
        const variantLines = productLines
          .filter((l) => (l.product_option_id ?? "") === key)
          .slice()
          .sort((a, b) => {
            const na = ingById.get(a.ingredient_id)?.name ?? "";
            const nb = ingById.get(b.ingredient_id)?.name ?? "";
            return na.localeCompare(nb, undefined, { sensitivity: "base" });
          });
        return {
          optionId,
          title: optionLabel(productId, optionId),
          lines: variantLines,
        };
      });

      return {
        productId,
        title: productLabel(productId),
        variants,
      };
    });
  }, [lines, productNames, optionNames, optionOrder, ingById, productLabel, optionLabel]);

  async function handleDelete(line: RecipeLine) {
    const ing = ingById.get(line.ingredient_id)?.name ?? "this row";
    if (!window.confirm(`Remove ${ing} from this recipe?`)) return;
    setBusy(true);
    try {
      const r = await withStaff(async (supabase) => {
        const { error: delErr } = await supabase.from("recipe_lines").delete().eq("id", line.id);
        return { error: delErr };
      });
      if (r === "ok") await load();
    } finally {
      setBusy(false);
    }
  }

  if (!hasSupabaseEnv()) {
    return (
      <p className="rounded-xl bg-amber-50 p-4 text-amber-900">Configure Supabase.</p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-primary-800">Recipes (BOM)</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Each block is one menu product. Inside, each section is a variant (or a shared fallback). Amounts are per{" "}
            <strong>1 kg</strong> of finished product, in that ingredient&apos;s unit (kg or L). Orders use
            variant-specific lines when present; otherwise lines with no variant apply to every option.
          </p>
        </div>
        <button
          type="button"
          disabled={busy || !!staffError || sortedProductIds.length === 0}
          className={btnPrimary}
          onClick={() => setDialog({ type: "add" })}
        >
          Add ingredient
        </button>
      </div>

      {staffError && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{staffError}</p>
      )}
      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">
          {error}
        </p>
      )}

      {sortedProductIds.length === 0 && !staffError && !error ? (
        <p className="rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-600">
          No products in the catalog. Add products under Menu first.
        </p>
      ) : grouped.length === 0 && !error && !staffError ? (
        <p className="rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-600">
          No recipe lines yet. Use <strong>Add ingredient</strong> to attach ingredients to a product variant.
        </p>
      ) : (
        <ul className="space-y-8">
          {grouped.map((product) => (
            <li
              key={product.productId}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
            >
              <div className="border-b border-slate-100 bg-slate-50/80 px-4 py-3 sm:px-5">
                <h2 className="font-display text-xl font-bold text-primary-800">{product.title}</h2>
                <p className="mt-0.5 font-mono text-xs text-slate-500">product_id: {product.productId}</p>
              </div>
              <div className="divide-y divide-slate-100">
                {product.variants.map((v) => (
                  <div key={v.optionId ?? "__base__"} className="px-4 py-4 sm:px-5">
                    <div className="mb-3 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                      <h3 className="text-sm font-semibold text-slate-900">{v.title}</h3>
                      {v.optionId != null && (
                        <span className="font-mono text-xs text-slate-500">option: {v.optionId}</span>
                      )}
                      {v.optionId == null && (
                        <span className="text-xs text-slate-500">(applies when no variant-specific recipe exists)</span>
                      )}
                    </div>
                    <div className="overflow-x-auto rounded-lg ring-1 ring-slate-200">
                      <table className="min-w-full text-left text-sm">
                        <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-600">
                          <tr>
                            <th className="px-3 py-2">Ingredient</th>
                            <th className="px-3 py-2">Amount / 1 kg product</th>
                            <th className="px-3 py-2 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {v.lines.map((l) => {
                            const ing = ingById.get(l.ingredient_id);
                            return (
                              <tr key={l.id} className="border-t border-slate-100">
                                <td className="px-3 py-2 text-slate-800">
                                  {ing?.name ?? l.ingredient_id}
                                  {ing?.track_unit ? (
                                    <span className="ml-1 text-xs font-normal text-slate-500">({ing.track_unit})</span>
                                  ) : null}
                                </td>
                                <td className="px-3 py-2 tabular-nums text-slate-800">
                                  {formatAmountPerKg(l.amount_per_kg_finished_product)}
                                </td>
                                <td className="px-3 py-2 text-right">
                                  <div className="flex flex-wrap justify-end gap-2">
                                    <button
                                      type="button"
                                      disabled={busy}
                                      className={btnSecondary}
                                      onClick={() => setDialog({ type: "edit", line: l })}
                                    >
                                      Edit
                                    </button>
                                    <button
                                      type="button"
                                      disabled={busy}
                                      className={btnDanger}
                                      onClick={() => void handleDelete(l)}
                                    >
                                      Remove
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}

      {dialog && (
        <RecipeLineModal
          dialog={dialog}
          busy={busy}
          sortedProductIds={sortedProductIds}
          productLabel={productLabel}
          productOptionsRows={productOptionsRows}
          optionLabel={optionLabel}
          ingredients={ingredients}
          onClose={() => setDialog(null)}
          onSave={async (payload) => {
            setBusy(true);
            try {
              const r = await withStaff(async (supabase) => {
                if (dialog.type === "add") {
                  const { error: insErr } = await supabase.from("recipe_lines").insert({
                    product_id: payload.product_id,
                    product_option_id: payload.product_option_id,
                    ingredient_id: payload.ingredient_id,
                    amount_per_kg_finished_product: payload.amount_per_kg_finished_product,
                  });
                  return { error: insErr };
                }
                const { error: upErr } = await supabase
                  .from("recipe_lines")
                  .update({
                    product_id: payload.product_id,
                    product_option_id: payload.product_option_id,
                    ingredient_id: payload.ingredient_id,
                    amount_per_kg_finished_product: payload.amount_per_kg_finished_product,
                  })
                  .eq("id", dialog.line.id);
                return { error: upErr };
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

type LinePayload = {
  product_id: string;
  product_option_id: string | null;
  ingredient_id: string;
  amount_per_kg_finished_product: number;
};

function RecipeLineModal({
  dialog,
  busy,
  sortedProductIds,
  productLabel,
  productOptionsRows,
  optionLabel,
  ingredients,
  onClose,
  onSave,
}: {
  dialog: { type: "add" } | { type: "edit"; line: RecipeLine };
  busy: boolean;
  sortedProductIds: string[];
  productLabel: (id: string) => string;
  productOptionsRows: ProductOption[];
  optionLabel: (productId: string, optionId: string | null) => string;
  ingredients: Ingredient[];
  onClose: () => void;
  onSave: (p: LinePayload) => void | Promise<void>;
}) {
  const line = dialog.type === "edit" ? dialog.line : null;

  const [productId, setProductId] = useState(line?.product_id ?? sortedProductIds[0] ?? "");
  const [optionChoice, setOptionChoice] = useState<string>(
    line ? (line.product_option_id == null ? SHARED_OPTION_VALUE : line.product_option_id) : SHARED_OPTION_VALUE,
  );
  const [ingredientId, setIngredientId] = useState(line?.ingredient_id ?? "");
  const [amountStr, setAmountStr] = useState(
    line ? String(line.amount_per_kg_finished_product) : "0.5",
  );

  useEffect(() => {
    if (dialog.type === "edit" && dialog.line) {
      const l = dialog.line;
      setProductId(l.product_id);
      setOptionChoice(l.product_option_id == null ? SHARED_OPTION_VALUE : l.product_option_id);
      setIngredientId(l.ingredient_id);
      setAmountStr(String(l.amount_per_kg_finished_product));
    } else {
      const firstPid = sortedProductIds[0] ?? "";
      setProductId(firstPid);
      const opts = productOptionsRows
        .filter((o) => o.product_id === firstPid)
        .sort((a, b) => a.sort_order - b.sort_order || a.id.localeCompare(b.id));
      setOptionChoice(opts.length > 0 ? opts[0]!.id : SHARED_OPTION_VALUE);
      setIngredientId("");
      setAmountStr("0.5");
    }
  }, [dialog, sortedProductIds, productOptionsRows]);

  const optsForProduct = useMemo(() => {
    return productOptionsRows
      .filter((o) => o.product_id === productId)
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order || a.id.localeCompare(b.id));
  }, [productOptionsRows, productId]);

  useEffect(() => {
    if (optsForProduct.length === 0) {
      setOptionChoice(SHARED_OPTION_VALUE);
      return;
    }
    const validIds = new Set(optsForProduct.map((o) => o.id));
    validIds.add(SHARED_OPTION_VALUE);
    if (!validIds.has(optionChoice)) {
      setOptionChoice(optsForProduct[0]!.id);
    }
  }, [productId, optsForProduct, optionChoice]);

  function resolveOptionId(): string | null {
    if (optsForProduct.length === 0) return null;
    if (optionChoice === SHARED_OPTION_VALUE) return null;
    return optionChoice;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const amount = Number(amountStr);
    if (!productId || !ingredientId.trim()) return;
    if (Number.isNaN(amount) || amount <= 0) return;
    await onSave({
      product_id: productId,
      product_option_id: resolveOptionId(),
      ingredient_id: ingredientId,
      amount_per_kg_finished_product: amount,
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="recipe-line-modal-title"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="recipe-line-modal-title" className="font-display text-xl font-bold text-primary-800">
          {dialog.type === "add" ? "Add ingredient to recipe" : "Edit recipe line"}
        </h2>
        <form onSubmit={(e) => void submit(e)} className="mt-4 space-y-3">
          <div>
            <label htmlFor="recipe-product" className="block text-sm font-medium text-slate-700">
              Product
            </label>
            <select
              id="recipe-product"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              required
            >
              {sortedProductIds.map((id) => (
                <option key={id} value={id}>
                  {productLabel(id)} ({id})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="recipe-option" className="block text-sm font-medium text-slate-700">
              Variant
            </label>
            {optsForProduct.length === 0 ? (
              <p id="recipe-option" className="mt-1 text-sm text-slate-600">
                This product has no variants — the line applies to the product as a whole.
              </p>
            ) : (
              <select
                id="recipe-option"
                value={optionChoice}
                onChange={(e) => setOptionChoice(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              >
                {optsForProduct.map((o) => (
                  <option key={o.id} value={o.id}>
                    {optionLabel(productId, o.id)} ({o.id})
                  </option>
                ))}
                <option value={SHARED_OPTION_VALUE}>Fallback (any variant without its own lines)</option>
              </select>
            )}
            <p className="mt-1 text-xs text-slate-500">
              If variant-specific lines exist for an order&apos;s option, those are used; otherwise shared lines apply.
            </p>
          </div>
          <div>
            <label htmlFor="recipe-ingredient" className="block text-sm font-medium text-slate-700">
              Ingredient
            </label>
            <select
              id="recipe-ingredient"
              value={ingredientId}
              onChange={(e) => setIngredientId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              required
            >
              <option value="">—</option>
              {ingredients.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name} ({i.track_unit})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="recipe-amount" className="block text-sm font-medium text-slate-700">
              Amount per 1 kg finished product
            </label>
            <input
              id="recipe-amount"
              type="number"
              step="any"
              min="0"
              value={amountStr}
              onChange={(e) => setAmountStr(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              required
            />
          </div>
          <div className="flex flex-wrap justify-end gap-2 pt-2">
            <button type="button" className={btnSecondary} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" disabled={busy || ingredients.length === 0} className={btnPrimary}>
              {busy ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
