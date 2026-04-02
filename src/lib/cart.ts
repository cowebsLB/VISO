export const CART_STORAGE_KEY = "viso-cart";
export const CART_VERSION = 2 as const;

export type CartLine = {
  productId: string;
  qty: number;
  title: string;
  unitPrice: number;
  /** Product image path for cart when catalog is DB-only */
  image?: string;
};

export type CartState = {
  v: typeof CART_VERSION;
  lines: CartLine[];
};

export function emptyCart(): CartState {
  return { v: CART_VERSION, lines: [] };
}

export function parseCart(raw: string | null): CartState {
  if (!raw) return emptyCart();
  try {
    const data = JSON.parse(raw) as { v?: number; lines?: CartLine[] };
    const ver = typeof data.v === "number" ? data.v : -1;
    if ((ver !== 1 && ver !== 2) || !Array.isArray(data.lines)) {
      return emptyCart();
    }
    return { v: CART_VERSION, lines: data.lines };
  } catch {
    return emptyCart();
  }
}

/** Cart line id format: `productId:optionId` */
export function parseCartLineCompositeId(compositeId: string): {
  productId: string;
  optionId: string | null;
} {
  const i = compositeId.indexOf(":");
  if (i <= 0) return { productId: compositeId, optionId: null };
  return {
    productId: compositeId.slice(0, i),
    optionId: compositeId.slice(i + 1) || null,
  };
}

export function cartLineTotal(line: CartLine): number {
  return Math.round(line.unitPrice * line.qty * 100) / 100;
}

export function cartSubtotal(lines: CartLine[]): number {
  return (
    Math.round(lines.reduce((s, l) => s + cartLineTotal(l), 0) * 100) / 100
  );
}

export function cartItemCount(lines: CartLine[]): number {
  return lines.reduce((n, l) => n + l.qty, 0);
}
