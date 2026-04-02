"use client";

import { getStaffSupabase } from "@/lib/admin/staff-access";
import { categoryMenuLabel } from "@/lib/admin/category-label";
import { publicAsset } from "@/lib/basePath";
import { productImageUrl } from "@/lib/images/product-image-url";
import { hasSupabaseEnv } from "@/lib/supabase/client";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  MenuItemModal,
  type CategoryRow,
  type OptionRow,
  type ProductRow,
} from "@/components/admin/products/MenuItemModal";

type Locale = "en" | "ar" | "hy";

type PiRow = {
  product_id: string;
  locale: string;
  name: string;
  description: string | null;
};

type PoiRow = {
  product_id: string;
  option_id: string;
  locale: string;
  name: string;
  description: string | null;
};

const btnEditOutline =
  "inline-flex items-center justify-center rounded-full border-2 border-primary-600 bg-white px-3 py-1.5 text-sm font-semibold text-primary-700 shadow-sm transition hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-1";
const btnDeleteOutline =
  "inline-flex items-center justify-center rounded-full border-2 border-red-600 bg-white px-3 py-1.5 text-sm font-semibold text-red-700 shadow-sm transition hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50";

function Thumb({ path }: { path: string | null }) {
  const fallback = publicAsset("/images/products/bread.svg");
  const desired = path?.trim() ? productImageUrl(path.trim()) : fallback;
  const [src, setSrc] = useState(desired);
  useEffect(() => {
    setSrc(desired);
  }, [desired]);
  return (
    // eslint-disable-next-line @next/next/no-img-element -- admin list; Supabase public URLs avoid next/image remote quirks in dev
    <img
      src={src}
      alt=""
      width={44}
      height={44}
      className="h-11 w-11 rounded-lg border border-slate-200 bg-slate-50 object-cover"
      onError={() => setSrc(fallback)}
    />
  );
}

export default function MenuItemsAdmin() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [options, setOptions] = useState<OptionRow[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [piRows, setPiRows] = useState<PiRow[]>([]);
  const [poiRows, setPoiRows] = useState<PoiRow[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [staffError, setStaffError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [modal, setModal] = useState<"closed" | "add" | "edit">("closed");
  const [editId, setEditId] = useState<string | null>(null);

  const optionsByProduct = useMemo(() => {
    const m = new Map<string, OptionRow[]>();
    for (const o of options) {
      const list = m.get(o.product_id) ?? [];
      list.push(o);
      m.set(o.product_id, list);
    }
    for (const list of m.values()) {
      list.sort((a, b) => a.sort_order - b.sort_order || a.id.localeCompare(b.id));
    }
    return m;
  }, [options]);

  const piByProduct = useMemo(() => {
    const m = new Map<string, Partial<Record<Locale, PiRow>>>();
    for (const r of piRows) {
      if (r.locale !== "en" && r.locale !== "ar" && r.locale !== "hy") continue;
      const loc = r.locale as Locale;
      const prev = m.get(r.product_id) ?? {};
      prev[loc] = r;
      m.set(r.product_id, prev);
    }
    return m;
  }, [piRows]);

  const poiByOption = useMemo(() => {
    const m = new Map<string, Partial<Record<Locale, PoiRow>>>();
    for (const r of poiRows) {
      if (r.locale !== "en" && r.locale !== "ar" && r.locale !== "hy") continue;
      const key = `${r.product_id}\t${r.option_id}`;
      const loc = r.locale as Locale;
      const prev = m.get(key) ?? {};
      prev[loc] = r;
      m.set(key, prev);
    }
    return m;
  }, [poiRows]);

  const load = useCallback(async () => {
    if (!hasSupabaseEnv()) return;
    const access = await getStaffSupabase();
    if (!access.ok) {
      setStaffError(access.message);
      setProducts([]);
      setOptions([]);
      setCategories([]);
      setPiRows([]);
      setPoiRows([]);
      return;
    }
    setStaffError(null);
    const { supabase } = access;
    const [pr, cr, or, pir, poir] = await Promise.all([
      supabase.from("products").select("*").order("id"),
      supabase.from("product_categories").select("id, slug").order("sort_order"),
      supabase
        .from("product_options")
        .select("product_id, id, sort_order, unit_price, weight_per_sale_unit_kg")
        .order("product_id")
        .order("sort_order"),
      supabase.from("product_i18n").select("product_id, locale, name, description"),
      supabase
        .from("product_option_i18n")
        .select("product_id, option_id, locale, name, description"),
    ]);
    setProducts((pr.data ?? []) as ProductRow[]);
    setCategories((cr.data ?? []) as CategoryRow[]);
    setOptions((or.data ?? []) as OptionRow[]);
    setPiRows((pir.data ?? []) as PiRow[]);
    setPoiRows((poir.data ?? []) as PoiRow[]);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => {
      const pi = piByProduct.get(p.id);
      const name = (pi?.en?.name ?? p.id).toLowerCase();
      const cat = categories.find((c) => c.id === p.category_id);
      const catSlug = (cat?.slug ?? "").toLowerCase();
      const catLabel = categoryMenuLabel(cat?.slug ?? "").toLowerCase();
      return (
        p.id.toLowerCase().includes(q) ||
        name.includes(q) ||
        catSlug.includes(q) ||
        catLabel.includes(q)
      );
    });
  }, [products, search, piByProduct, categories]);

  function minPrice(rows: OptionRow[]): number | null {
    if (!rows.length) return null;
    return Math.min(...rows.map((o) => Number(o.unit_price)));
  }

  async function toggleActive(p: ProductRow) {
    setError(null);
    setBusy(true);
    try {
      const access = await getStaffSupabase();
      if (!access.ok) {
        setStaffError(access.message);
        return;
      }
      const { supabase } = access;
      const { error: e } = await supabase
        .from("products")
        .update({ is_active: !p.is_active })
        .eq("id", p.id);
      if (e) setError(e.message);
      else await load();
    } finally {
      setBusy(false);
    }
  }

  async function removeProduct(p: ProductRow) {
    const label = piByProduct.get(p.id)?.en?.name ?? p.id;
    if (!window.confirm(`Delete “${label}” from the menu?`)) return;
    if (
      !window.confirm(
        `Second step: permanently remove “${label}”? This cannot be undone. Click OK only if you are sure.`,
      )
    ) {
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const access = await getStaffSupabase();
      if (!access.ok) {
        setStaffError(access.message);
        return;
      }
      const { supabase } = access;
      const { error: e } = await supabase.from("products").delete().eq("id", p.id);
      if (e) {
        setError(
          e.message.includes("order") || e.code === "23503"
            ? "This item is linked to past orders and cannot be deleted. Turn off “On website” instead."
            : e.message,
        );
        return;
      }
      setModal("closed");
      setEditId(null);
      await load();
    } finally {
      setBusy(false);
    }
  }

  const editingProduct = editId ? products.find((p) => p.id === editId) ?? null : null;
  const editPi = editingProduct ? piByProduct.get(editingProduct.id) : undefined;
  const editNames: Record<Locale, string> = {
    en: editPi?.en?.name ?? editingProduct?.id ?? "",
    ar: editPi?.ar?.name ?? "",
    hy: editPi?.hy?.name ?? "",
  };
  const editDescEn = editPi?.en?.description ?? "";
  const editOptions = useMemo(
    () => (editingProduct ? (optionsByProduct.get(editingProduct.id) ?? []) : []),
    [editingProduct, optionsByProduct],
  );
  const editOptionLabels = useMemo(() => {
    const m = new Map<string, string>();
    if (!editingProduct) return m;
    for (const o of editOptions) {
      const key = `${editingProduct.id}\t${o.id}`;
      m.set(o.id, poiByOption.get(key)?.en?.name ?? o.id);
    }
    return m;
  }, [editingProduct, editOptions, poiByOption]);

  if (!hasSupabaseEnv()) {
    return (
      <p className="rounded-xl bg-amber-50 p-4 text-amber-900">
        Connect Supabase to manage the menu.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-primary-800">Menu</h1>
        <p className="mt-1 text-slate-600">
          Edit names, prices, and photos here. Turning off “On website” hides an item without
          deleting it. After you save, ask whoever publishes the site to run a fresh publish so the
          public menu matches (static hosting reads the catalog at build time).
        </p>
      </div>

      {staffError && (
        <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-950 ring-1 ring-amber-200">
          {staffError}
        </p>
      )}
      {error && (
        <p className="rounded-xl bg-red-50 p-3 text-sm text-red-800" role="alert">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <label htmlFor="menu-search" className="sr-only">
            Search menu
          </label>
          <input
            id="menu-search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or category…"
            className="w-full rounded-full border border-slate-300 bg-white py-2.5 pl-4 pr-4 text-sm shadow-sm outline-none focus:ring-2 focus:ring-primary-400"
          />
        </div>
        <button
          type="button"
          onClick={() => {
            setError(null);
            setModal("add");
            setEditId(null);
          }}
          className="shrink-0 rounded-full bg-primary-600 px-6 py-2.5 font-semibold text-white hover:bg-primary-700"
        >
          Add item
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white py-12 text-center text-slate-500 shadow-sm">
          {products.length === 0
            ? "No items yet. Click Add item."
            : "No matches. Try another search."}
        </div>
      ) : (
        <>
          <ul className="space-y-3 xl:hidden" aria-label="Menu items">
            {filtered.map((p) => {
              const pi = piByProduct.get(p.id);
              const name = pi?.en?.name ?? p.id;
              const cat = categories.find((c) => c.id === p.category_id);
              const orows = optionsByProduct.get(p.id) ?? [];
              const minP = minPrice(orows);
              return (
                <li
                  key={p.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm ring-1 ring-slate-100"
                >
                  <div className="flex gap-3">
                    <Thumb path={p.image_path} />
                    <div className="min-w-0 flex-1 space-y-2">
                      <p className="font-semibold text-slate-900">{name}</p>
                      <p className="text-sm text-slate-600">
                        {cat ? categoryMenuLabel(cat.slug) : "—"}
                        <span className="text-slate-300"> · </span>
                        {orows.length} choice{orows.length === 1 ? "" : "s"}
                        <span className="text-slate-300"> · </span>
                        From {minP != null ? `$${minP.toFixed(2)}` : "—"}
                      </p>
                      <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          checked={p.is_active}
                          disabled={busy}
                          onChange={() => void toggleActive(p)}
                        />
                        On website
                      </label>
                      <div className="flex flex-wrap gap-2 pt-1">
                        <button
                          type="button"
                          className={btnEditOutline}
                          onClick={() => {
                            setError(null);
                            setEditId(p.id);
                            setModal("edit");
                          }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className={btnDeleteOutline}
                          disabled={busy}
                          onClick={() => void removeProduct(p)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="hidden overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm xl:block">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <tr>
                  <th className="w-14 px-3 py-3 font-semibold" scope="col">
                    <span className="sr-only">Photo</span>
                  </th>
                  <th className="px-3 py-3 font-semibold" scope="col">
                    Name
                  </th>
                  <th className="px-3 py-3 font-semibold" scope="col">
                    Category
                  </th>
                  <th className="px-3 py-3 font-semibold" scope="col">
                    On website
                  </th>
                  <th className="px-3 py-3 font-semibold" scope="col">
                    Choices
                  </th>
                  <th className="px-3 py-3 font-semibold" scope="col">
                    From
                  </th>
                  <th className="px-3 py-3 font-semibold" scope="col">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const pi = piByProduct.get(p.id);
                  const name = pi?.en?.name ?? p.id;
                  const cat = categories.find((c) => c.id === p.category_id);
                  const orows = optionsByProduct.get(p.id) ?? [];
                  const minP = minPrice(orows);
                  return (
                    <tr key={p.id} className="border-b border-slate-100 last:border-0">
                      <td className="px-3 py-2">
                        <Thumb path={p.image_path} />
                      </td>
                      <td className="px-3 py-2 font-medium text-slate-900">{name}</td>
                      <td className="px-3 py-2 text-slate-600">
                        {cat ? categoryMenuLabel(cat.slug) : "—"}
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          checked={p.is_active}
                          disabled={busy}
                          onChange={() => void toggleActive(p)}
                          aria-label={`Show ${name} on website`}
                        />
                      </td>
                      <td className="px-3 py-2 text-slate-600">{orows.length}</td>
                      <td className="px-3 py-2 text-slate-800">
                        {minP != null ? `$${minP.toFixed(2)}` : "—"}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            className={btnEditOutline}
                            onClick={() => {
                              setError(null);
                              setEditId(p.id);
                              setModal("edit");
                            }}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className={btnDeleteOutline}
                            disabled={busy}
                            onClick={() => void removeProduct(p)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      <MenuItemModal
        open={modal !== "closed"}
        mode={modal === "edit" ? "edit" : "add"}
        onClose={() => {
          setModal("closed");
          setEditId(null);
        }}
        categories={categories}
        product={modal === "edit" ? editingProduct : null}
        names={modal === "edit" ? editNames : { en: "", ar: "", hy: "" }}
        descEn={modal === "edit" ? editDescEn : ""}
        existingOptions={modal === "edit" ? editOptions : []}
        optionNameEn={modal === "edit" ? editOptionLabels : new Map()}
        allProductIds={products.map((p) => p.id)}
        onSaved={() => void load()}
        onCategoriesUpdated={() => void load()}
        onError={setError}
      />
    </div>
  );
}
