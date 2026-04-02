"use client";

import { getStaffSupabase } from "@/lib/admin/staff-access";
import { categoryMenuLabel } from "@/lib/admin/category-label";
import {
  prepareImageForUpload,
  storageImageContentType,
} from "@/lib/admin/prepare-image-upload";
import { productImageUrl } from "@/lib/images/product-image-url";
import { PRODUCT_IMAGES_BUCKET } from "@/lib/supabase/product-images-bucket";
import { storageUploadUserHint } from "@/lib/admin/storage-upload-hint";
import { uniqueSlug } from "@/lib/admin/slugify";
import { useEffect, useRef, useState } from "react";

const LOCALES = ["en", "ar", "hy"] as const;
type Locale = (typeof LOCALES)[number];

export type CategoryRow = { id: string; slug: string };

export type ProductRow = {
  id: string;
  category_id: string | null;
  is_active: boolean;
  weight_per_sale_unit_kg: string | number;
  image_path: string | null;
};

export type OptionRow = {
  product_id: string;
  id: string;
  sort_order: number;
  unit_price: string | number;
};

type OptForm = {
  clientKey: string;
  dbId: string | null;
  labelEn: string;
  price: string;
  sort: string;
};

function newOptRow(): OptForm {
  return {
    clientKey: crypto.randomUUID(),
    dbId: null,
    labelEn: "",
    price: "",
    sort: "1",
  };
}

type Props = {
  open: boolean;
  mode: "add" | "edit";
  onClose: () => void;
  categories: CategoryRow[];
  /** edit */
  product: ProductRow | null;
  names: Record<Locale, string>;
  descEn: string;
  existingOptions: OptionRow[];
  optionNameEn: Map<string, string>;
  allProductIds: string[];
  onSaved: () => void;
  /** Refetch categories after creating a new one (e.g. reload parent list). */
  onCategoriesUpdated?: () => void;
  onError: (msg: string | null) => void;
};

export function MenuItemModal({
  open,
  mode,
  onClose,
  categories,
  product,
  names,
  descEn,
  existingOptions,
  optionNameEn,
  allProductIds,
  onSaved,
  onCategoriesUpdated,
  onError,
}: Props) {
  const [saving, setSaving] = useState(false);
  const [nameEn, setNameEn] = useState("");
  const [descriptionEn, setDescriptionEn] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [nameHy, setNameHy] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [weightKg, setWeightKg] = useState("1");
  const [imagePath, setImagePath] = useState("");
  const [opts, setOpts] = useState<OptForm[]>([newOptRow()]);
  const [newCategoryLabel, setNewCategoryLabel] = useState("");
  const [addingCategory, setAddingCategory] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [preferWebpUpload, setPreferWebpUpload] = useState(true);
  const [imageUploadHint, setImageUploadHint] = useState<string | null>(null);
  const modalWasOpenRef = useRef(false);
  const imageFileInputRef = useRef<HTMLInputElement>(null);
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      modalWasOpenRef.current = false;
      return;
    }
    const justOpened = !modalWasOpenRef.current;
    modalWasOpenRef.current = true;

    onErrorRef.current(null);
    if (mode === "add") {
      if (justOpened) {
        setNameEn("");
        setDescriptionEn("");
        setNameAr("");
        setNameHy("");
        setCategoryId(categories[0]?.id ?? "");
        setNewCategoryLabel("");
        setIsActive(true);
        setWeightKg("1");
        setImagePath("");
        setOpts([newOptRow()]);
      }
      return;
    }
    if (!product) return;
    setNameEn(names.en || product.id);
    setDescriptionEn(descEn);
    setNameAr(names.ar || "");
    setNameHy(names.hy || "");
    setCategoryId(product.category_id ?? "");
    setIsActive(product.is_active);
    setWeightKg(String(product.weight_per_sale_unit_kg));
    setImagePath(product.image_path ?? "");
    setImageUploadHint(null);
    const sorted = [...existingOptions].sort(
      (a, b) => a.sort_order - b.sort_order || a.id.localeCompare(b.id),
    );
    setOpts(
      sorted.length
        ? sorted.map((o) => ({
            clientKey: o.id,
            dbId: o.id,
            labelEn: optionNameEn.get(o.id) ?? o.id,
            price: String(o.unit_price),
            sort: String(o.sort_order),
          }))
        : [newOptRow()],
    );
    if (justOpened) setNewCategoryLabel("");
    // onError omitted from deps on purpose: keep array length stable across HMR and use latest callback via ref.
  }, [open, mode, product, names, descEn, existingOptions, optionNameEn, categories]);

  function addOptLine() {
    setOpts((prev) => [...prev, newOptRow()]);
  }

  function removeOptLine(key: string) {
    setOpts((prev) => (prev.length <= 1 ? prev : prev.filter((o) => o.clientKey !== key)));
  }

  function updateOpt(key: string, patch: Partial<OptForm>) {
    setOpts((prev) => prev.map((o) => (o.clientKey === key ? { ...o, ...patch } : o)));
  }

  async function handleImageFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    onError(null);
    setImageUploadHint(null);
    const access = await getStaffSupabase();
    if (!access.ok) {
      onError(access.message);
      return;
    }
    const { supabase } = access;
    setUploadingImage(true);
    try {
      let prepared;
      try {
        prepared = await prepareImageForUpload(file, { preferWebp: preferWebpUpload });
      } catch (err) {
        onError(err instanceof Error ? err.message : "Could not read that image file.");
        return;
      }
      const key = `menu/${crypto.randomUUID()}.${prepared.objectExt}`;
      const contentType = storageImageContentType(prepared);
      const { error } = await supabase.storage.from(PRODUCT_IMAGES_BUCKET).upload(key, prepared.blob, {
        contentType,
        cacheControl: "3600",
        upsert: false,
      });
      if (error) {
        onError(storageUploadUserHint(error.message, PRODUCT_IMAGES_BUCKET));
        return;
      }
      setImagePath(key);
      setImageUploadHint("Uploaded — press Save to apply.");
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleAddCategory() {
    onError(null);
    const label = newCategoryLabel.trim();
    if (!label) {
      onError("Enter a name for the new category.");
      return;
    }
    const access = await getStaffSupabase();
    if (!access.ok) {
      onError(access.message);
      return;
    }
    const { supabase } = access;
    const taken = new Set(categories.map((c) => c.slug));
    const slug = uniqueSlug(label, taken);
    setAddingCategory(true);
    try {
      const { data: maxRows, error: maxErr } = await supabase
        .from("product_categories")
        .select("sort_order")
        .order("sort_order", { ascending: false })
        .limit(1);
      if (maxErr) {
        onError(maxErr.message);
        return;
      }
      const nextSort = (maxRows?.[0]?.sort_order ?? 0) + 1;
      const { data: inserted, error: insErr } = await supabase
        .from("product_categories")
        .insert({ slug, sort_order: nextSort })
        .select("id")
        .single();
      if (insErr) {
        onError(insErr.message);
        return;
      }
      if (inserted?.id) {
        setCategoryId(inserted.id);
        setNewCategoryLabel("");
        onCategoriesUpdated?.();
      }
    } finally {
      setAddingCategory(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onError(null);
    const access = await getStaffSupabase();
    if (!access.ok) {
      onError(access.message);
      return;
    }
    const { supabase } = access;

    const trimmedOpts = opts
      .map((o) => ({
        ...o,
        labelEn: o.labelEn.trim(),
        priceN: Number(o.price),
        sortN: Math.max(0, Number(o.sort) || 0),
      }))
      .filter((o) => o.labelEn && Number.isFinite(o.priceN) && o.priceN >= 0);
    if (!nameEn.trim()) {
      onError("Enter a product name.");
      return;
    }
    if (!categoryId) {
      onError("Choose a category.");
      return;
    }
    if (trimmedOpts.length === 0) {
      onError("Add at least one choice with a name and price.");
      return;
    }

    setSaving(true);
    try {
      if (mode === "add") {
        const taken = new Set(allProductIds);
        const productId = uniqueSlug(nameEn, taken);
        const { error: pErr } = await supabase.from("products").insert({
          id: productId,
          category_id: categoryId,
          is_active: isActive,
          weight_per_sale_unit_kg: Number(weightKg) || 1,
          image_path: imagePath.trim() || null,
        });
        if (pErr) {
          onError(pErr.message);
          return;
        }
        const n = nameEn.trim();
        const { error: piErr } = await supabase.from("product_i18n").insert(
          LOCALES.map((locale) => ({
            product_id: productId,
            locale,
            name: locale === "en" ? n : locale === "ar" ? (nameAr.trim() || n) : (nameHy.trim() || n),
            description: locale === "en" ? descriptionEn : "",
          })),
        );
        if (piErr) {
          onError(piErr.message);
          return;
        }
        const usedOptIds = new Set<string>();
        for (let i = 0; i < trimmedOpts.length; i++) {
          const o = trimmedOpts[i];
          const optionId = uniqueSlug(o.labelEn, usedOptIds);
          usedOptIds.add(optionId);
          const sortOrder = o.sortN || i + 1;
          const { error: oErr } = await supabase.from("product_options").insert({
            product_id: productId,
            id: optionId,
            sort_order: sortOrder,
            unit_price: o.priceN,
            weight_per_sale_unit_kg: null,
          });
          if (oErr) {
            onError(oErr.message);
            return;
          }
          const label = o.labelEn;
          const { error: oiErr } = await supabase.from("product_option_i18n").insert(
            LOCALES.map((locale) => ({
              product_id: productId,
              option_id: optionId,
              locale,
              name: label,
              description: "",
            })),
          );
          if (oiErr) {
            onError(oiErr.message);
            return;
          }
        }
      } else if (product) {
        const pid = product.id;
        const { error: uErr } = await supabase
          .from("products")
          .update({
            category_id: categoryId,
            is_active: isActive,
            weight_per_sale_unit_kg: Number(weightKg) || 1,
            image_path: imagePath.trim() || null,
          })
          .eq("id", pid);
        if (uErr) {
          onError(uErr.message);
          return;
        }
        const n = nameEn.trim();
        for (const locale of LOCALES) {
          const name =
            locale === "en" ? n : locale === "ar" ? (nameAr.trim() || n) : (nameHy.trim() || n);
          const desc = locale === "en" ? descriptionEn : "";
          const { error: e } = await supabase.from("product_i18n").upsert(
            { product_id: pid, locale, name, description: desc },
            { onConflict: "product_id,locale" },
          );
          if (e) {
            onError(e.message);
            return;
          }
        }
        const prevIds = new Set(existingOptions.map((o) => o.id));
        const keepIds = new Set(trimmedOpts.filter((o) => o.dbId).map((o) => o.dbId as string));
        for (const oldId of prevIds) {
          if (!keepIds.has(oldId)) {
            const { error: dErr } = await supabase
              .from("product_options")
              .delete()
              .eq("product_id", pid)
              .eq("id", oldId);
            if (dErr) {
              onError(
                dErr.message.includes("recipe") || dErr.code === "23503"
                  ? "Cannot remove a choice that is still used in Recipes. Remove it there first."
                  : dErr.message,
              );
              return;
            }
          }
        }
        const usedOptIds = new Set<string>(keepIds);
        for (let i = 0; i < trimmedOpts.length; i++) {
          const o = trimmedOpts[i];
          const sortOrder = o.sortN || i + 1;
          if (o.dbId) {
            const { error: ouErr } = await supabase
              .from("product_options")
              .update({
                sort_order: sortOrder,
                unit_price: o.priceN,
              })
              .eq("product_id", pid)
              .eq("id", o.dbId);
            if (ouErr) {
              onError(ouErr.message);
              return;
            }
            const { error: oiErr } = await supabase.from("product_option_i18n").upsert(
              {
                product_id: pid,
                option_id: o.dbId,
                locale: "en",
                name: o.labelEn,
                description: "",
              },
              { onConflict: "product_id,option_id,locale" },
            );
            if (oiErr) {
              onError(oiErr.message);
              return;
            }
          } else {
            const optionId = uniqueSlug(o.labelEn, usedOptIds);
            usedOptIds.add(optionId);
            const { error: insErr } = await supabase.from("product_options").insert({
              product_id: pid,
              id: optionId,
              sort_order: sortOrder,
              unit_price: o.priceN,
              weight_per_sale_unit_kg: null,
            });
            if (insErr) {
              onError(insErr.message);
              return;
            }
            const { error: oiErr } = await supabase.from("product_option_i18n").insert(
              LOCALES.map((locale) => ({
                product_id: pid,
                option_id: optionId,
                locale,
                name: o.labelEn,
                description: "",
              })),
            );
            if (oiErr) {
              onError(oiErr.message);
              return;
            }
          }
        }
      }
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="menu-item-modal-title"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 id="menu-item-modal-title" className="font-display text-xl font-bold text-primary-800">
            {mode === "add" ? "Add item" : "Edit item"}
          </h2>
        </div>
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4 px-6 py-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Name</label>
            <input
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              placeholder="e.g. Armenian Gata"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Description (optional)</label>
            <textarea
              value={descriptionEn}
              onChange={(e) => setDescriptionEn(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700">Arabic name (optional)</label>
              <input
                value={nameAr}
                onChange={(e) => setNameAr(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Armenian name (optional)</label>
              <input
                value={nameHy}
                onChange={(e) => setNameHy(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Category</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              aria-label="Category"
            >
              <option value="">Select…</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {categoryMenuLabel(c.slug)}
                </option>
              ))}
            </select>
            <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-medium text-slate-700">New category</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <input
                  value={newCategoryLabel}
                  onChange={(e) => setNewCategoryLabel(e.target.value)}
                  placeholder="e.g. pastries"
                  className="min-w-[10rem] flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                  aria-label="New category name"
                />
                <button
                  type="button"
                  disabled={addingCategory}
                  onClick={() => void handleAddCategory()}
                  className="rounded-lg bg-slate-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {addingCategory ? "Adding…" : "Add category"}
                </button>
              </div>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            Show on website
          </label>
          <div>
            <label className="block text-sm font-medium text-slate-700">Kilograms per unit (usually 1)</label>
            <input
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              type="number"
              step="0.01"
              min="0.01"
              className="mt-1 w-32 rounded-lg border border-slate-300 px-3 py-2"
            />
          </div>
          <div>
            <span className="block text-sm font-medium text-slate-700">Photo</span>
            <p className="mt-0.5 text-xs text-slate-500">
              Upload a file, then save. Or set a site image path (starts with <span className="font-mono">/</span>
              ).
            </p>
            <input
              ref={imageFileInputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              aria-hidden
              tabIndex={-1}
              onChange={(ev) => void handleImageFileChange(ev)}
            />
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <button
                type="button"
                disabled={uploadingImage}
                onClick={() => imageFileInputRef.current?.click()}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-50"
              >
                {uploadingImage ? "Uploading…" : "Upload image"}
              </button>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={preferWebpUpload}
                  onChange={(e) => setPreferWebpUpload(e.target.checked)}
                />
                Prefer WebP
              </label>
            </div>
            <label htmlFor="menu-item-image-path" className="mt-3 block text-xs font-medium text-slate-600">
              Path
            </label>
            <input
              id="menu-item-image-path"
              value={imagePath}
              onChange={(e) => {
                setImagePath(e.target.value);
                setImageUploadHint(null);
              }}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm"
              placeholder="/images/products/brioche.webp"
              aria-label="Image path"
            />
            {imagePath.trim() && !imagePath.trim().startsWith("/") && (
              <div className="mt-2 flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element -- small preview; remote Supabase URL */}
                <img
                  src={productImageUrl(imagePath.trim())}
                  alt="Photo preview"
                  className="h-14 w-14 shrink-0 rounded-lg border border-slate-200 bg-slate-100 object-cover"
                  onError={(ev) => {
                    ev.currentTarget.style.visibility = "hidden";
                  }}
                />
              </div>
            )}
            {imageUploadHint && (
              <p className="mt-2 text-sm font-medium text-emerald-700" role="status">
                {imageUploadHint}
              </p>
            )}
          </div>

          <div className="border-t border-slate-100 pt-3">
            <p className="text-sm font-medium text-slate-800">Choices &amp; prices</p>
            <p className="text-xs text-slate-500">What customers pick (flavor, size, etc.).</p>
            <ul className="mt-2 space-y-2">
              {opts.map((o) => (
                <li
                  key={o.clientKey}
                  className="flex flex-wrap items-end gap-2 rounded-lg bg-slate-50 p-2"
                >
                  <div className="min-w-[8rem] flex-1">
                    <label className="text-xs text-slate-600">Name</label>
                    <input
                      value={o.labelEn}
                      onChange={(e) => updateOpt(o.clientKey, { labelEn: e.target.value })}
                      className="mt-0.5 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
                    />
                  </div>
                  <div className="w-24">
                    <label className="text-xs text-slate-600">Price</label>
                    <input
                      value={o.price}
                      onChange={(e) => updateOpt(o.clientKey, { price: e.target.value })}
                      type="number"
                      step="0.01"
                      min="0"
                      className="mt-0.5 w-full rounded border border-slate-300 px-2 py-1.5"
                    />
                  </div>
                  <div className="w-16">
                    <label className="text-xs text-slate-600">Order</label>
                    <input
                      value={o.sort}
                      onChange={(e) => updateOpt(o.clientKey, { sort: e.target.value })}
                      type="number"
                      min="0"
                      className="mt-0.5 w-full rounded border border-slate-300 px-2 py-1.5"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeOptLine(o.clientKey)}
                    className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-600 hover:bg-slate-100"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={addOptLine}
              className="mt-2 text-sm font-semibold text-primary-700 underline"
            >
              + Add choice
            </button>
          </div>

          <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-primary-600 px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
