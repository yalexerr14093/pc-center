export const ORDER_FLOW = ["CREATED", "CONFIRMED", "PAID", "SHIPPED", "DELIVERED"] as const;
export type OrderFlowStatus = (typeof ORDER_FLOW)[number];

export type StatusTone = "slate" | "amber" | "sky" | "violet" | "emerald" | "red";

export type StatusMeta = {
  label: string;
  hint: string;
  tone: StatusTone;
};

const flowMeta: Record<OrderFlowStatus, StatusMeta> = {
  CREATED: {
    label: "Создан",
    hint: "Принят в обработку",
    tone: "slate"
  },
  CONFIRMED: {
    label: "Подтверждён",
    hint: "Проверен продавцом",
    tone: "amber"
  },
  PAID: {
    label: "Оплачен",
    hint: "Оплата получена",
    tone: "sky"
  },
  SHIPPED: {
    label: "В доставке",
    hint: "Передан службе доставки",
    tone: "violet"
  },
  DELIVERED: {
    label: "Доставлен",
    hint: "Покупатель получил заказ",
    tone: "emerald"
  }
};

export function normalizeOrderStatus(status: string): OrderFlowStatus | "CANCELLED" | string {
  if (status === "PENDING") return "CREATED";
  if (status === "CANCELLED") return "CANCELLED";
  if ((ORDER_FLOW as readonly string[]).includes(status)) return status as OrderFlowStatus;
  return status;
}

export function getOrderStatusMeta(status: string): StatusMeta {
  const n = normalizeOrderStatus(status);
  if (n === "CANCELLED") {
    return { label: "Отменён", hint: "Заказ не будет выполнен", tone: "red" };
  }
  if (n in flowMeta) return flowMeta[n as OrderFlowStatus];
  return { label: status, hint: "", tone: "slate" };
}

export function flowIndex(status: string): number {
  const n = normalizeOrderStatus(status);
  if (n === "CANCELLED") return -1;
  const i = ORDER_FLOW.indexOf(n as OrderFlowStatus);
  return i >= 0 ? i : 0;
}

export function isCancelled(status: string): boolean {
  return normalizeOrderStatus(status) === "CANCELLED";
}

export function canBuyerCancel(status: string): boolean {
  const n = normalizeOrderStatus(status);
  return n === "CREATED";
}

const toneClass: Record<StatusTone, string> = {
  slate: "bg-slate-100 text-slate-800 ring-slate-200/80",
  amber: "bg-amber-100 text-amber-950 ring-amber-200/80",
  sky: "bg-sky-100 text-sky-950 ring-sky-200/80",
  violet: "bg-violet-100 text-violet-950 ring-violet-200/80",
  emerald: "bg-emerald-100 text-emerald-950 ring-emerald-200/80",
  red: "bg-red-100 text-red-900 ring-red-200/80"
};

export function statusBadgeClass(status: string): string {
  return toneClass[getOrderStatusMeta(status).tone];
}

/** Тексты для кнопок администратора при переходе в `next` */
export function adminActionCopy(next: string): { title: string; subtitle: string; danger?: boolean } {
  switch (next) {
    case "CONFIRMED":
      return {
        title: "Подтвердить заказ",
        subtitle: "Проверьте состав, адрес и наличие товара перед отправкой."
      };
    case "PAID":
      return {
        title: "Зафиксировать оплату",
        subtitle: "Покупатель оплатил — можно готовить отправку."
      };
    case "SHIPPED":
      return {
        title: "Передать в доставку",
        subtitle: "Заказ передан курьеру или в службу доставки."
      };
    case "DELIVERED":
      return {
        title: "Отметить доставленным",
        subtitle: "Покупатель получил заказ — сделка завершена."
      };
    case "CANCELLED":
      return {
        title: "Отменить заказ",
        subtitle: "Позиции вернутся на склад, оплата при необходимости оформляется вручную.",
        danger: true
      };
    default:
      return { title: next, subtitle: "" };
  }
}
