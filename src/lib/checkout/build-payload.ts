import {
  type CartLine,
  cartLineTotal,
  cartSubtotal,
  parseCartLineCompositeId,
} from "@/lib/cart";

export type CheckoutRpcPayload = {
  subtotal: number;
  customer_name: string;
  phone: string;
  notes: string | null;
  pickup_note: string | null;
  locale: string;
  currency: string;
  lines: {
    product_id: string;
    option_id: string;
    qty: number;
    unit_price: number;
    line_total: number;
    title_snapshot: string;
  }[];
};

export function buildCreateOrderFromCheckoutPayload(
  lines: CartLine[],
  fields: {
    customerName: string;
    phone: string;
    notes: string;
    pickupNote: string;
    locale: string;
  },
): CheckoutRpcPayload {
  return {
    subtotal: cartSubtotal(lines),
    customer_name: fields.customerName.trim(),
    phone: fields.phone.trim(),
    notes: fields.notes.trim() || null,
    pickup_note: fields.pickupNote.trim() || null,
    locale: fields.locale,
    currency: "USD",
    lines: lines.map((line) => {
      const { productId, optionId } = parseCartLineCompositeId(line.productId);
      return {
        product_id: productId,
        option_id: optionId ?? "",
        qty: line.qty,
        unit_price: line.unitPrice,
        line_total: cartLineTotal(line),
        title_snapshot: line.title,
      };
    }),
  };
}
