export type OrderStatus =
  | "pending"
  | "confirmed"
  | "in_progress"
  | "ready"
  | "completed"
  | "cancelled";

const transitions: Record<OrderStatus, OrderStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["in_progress", "cancelled"],
  in_progress: ["ready"],
  ready: ["completed"],
  completed: [],
  cancelled: [],
};

export function allowedNextStatuses(current: OrderStatus): OrderStatus[] {
  return transitions[current] ?? [];
}

export function canTransitionTo(
  current: OrderStatus,
  next: OrderStatus,
): boolean {
  return allowedNextStatuses(current).includes(next);
}

/** Use confirm_order RPC instead of update_order_status for pending → confirmed. */
export function mustUseConfirmOrder(
  current: OrderStatus,
  next: OrderStatus,
): boolean {
  return current === "pending" && next === "confirmed";
}
