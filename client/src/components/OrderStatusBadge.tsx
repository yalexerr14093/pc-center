import clsx from "clsx";
import { getOrderStatusMeta, statusBadgeClass } from "../lib/orderStatus";

export function OrderStatusBadge({ status, className }: { status: string; className?: string }) {
  const meta = getOrderStatusMeta(status);
  return (
    <span
      title={meta.hint || undefined}
      className={clsx(
        "inline-flex items-center rounded-xl px-2.5 py-1 text-xs font-semibold ring-1 ring-inset",
        statusBadgeClass(status),
        className
      )}
    >
      {meta.label}
    </span>
  );
}
