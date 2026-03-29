"use client";

import {
  CART_STORAGE_KEY,
  type CartLine,
  type CartState,
  cartItemCount,
  emptyCart,
  parseCart,
} from "@/lib/cart";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type CartContextValue = {
  lines: CartLine[];
  totalItems: number;
  setCart: (next: CartState) => void;
  addLine: (line: Omit<CartLine, "qty"> & { qty?: number }) => void;
  removeLine: (productId: string) => void;
  setQty: (productId: string, qty: number) => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function readCart(): CartState {
  if (typeof window === "undefined") return emptyCart();
  try {
    return parseCart(localStorage.getItem(CART_STORAGE_KEY));
  } catch {
    return emptyCart();
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CartState>(emptyCart);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setState(readCart());
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state, mounted]);

  const setCart = useCallback((next: CartState) => {
    setState(next);
  }, []);

  const addLine = useCallback(
    (line: Omit<CartLine, "qty"> & { qty?: number }) => {
      const qty = line.qty ?? 1;
      setState((prev) => {
        const lines = [...prev.lines];
        const i = lines.findIndex((l) => l.productId === line.productId);
        if (i >= 0) {
          lines[i] = {
            ...lines[i],
            qty: lines[i].qty + qty,
            title: line.title,
            unitPrice: line.unitPrice,
          };
        } else {
          lines.push({
            productId: line.productId,
            title: line.title,
            unitPrice: line.unitPrice,
            qty,
          });
        }
        return { ...prev, lines };
      });
    },
    [],
  );

  const removeLine = useCallback((productId: string) => {
    setState((prev) => ({
      ...prev,
      lines: prev.lines.filter((l) => l.productId !== productId),
    }));
  }, []);

  const setQty = useCallback((productId: string, qty: number) => {
    const q = Math.max(0, Math.floor(qty));
    setState((prev) => {
      if (q === 0) {
        return {
          ...prev,
          lines: prev.lines.filter((l) => l.productId !== productId),
        };
      }
      return {
        ...prev,
        lines: prev.lines.map((l) =>
          l.productId === productId ? { ...l, qty: q } : l,
        ),
      };
    });
  }, []);

  const totalItems = useMemo(() => cartItemCount(state.lines), [state.lines]);

  const value = useMemo(
    () => ({
      lines: state.lines,
      totalItems,
      setCart,
      addLine,
      removeLine,
      setQty,
    }),
    [state.lines, totalItems, setCart, addLine, removeLine, setQty],
  );

  return (
    <CartContext.Provider value={value}>{children}</CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within CartProvider");
  }
  return ctx;
}
