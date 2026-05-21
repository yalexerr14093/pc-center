import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { Link } from "react-router-dom";
import { api } from "../../lib/api";
import { formatRub } from "../../lib/format";
import { adminActionCopy } from "../../lib/orderStatus";
import { OrderStatusBadge } from "../../components/OrderStatusBadge";
import { OrderStatusStepper } from "../../components/OrderStatusStepper";

type OrderLine = {
  id: string;
  name: string;
  priceRub: number;
  quantity: number;
  productId: string;
  product?: { id: string; name: string; category: string };
};

type OrderRow = {
  id: string;
  createdAt: string;
  totalRub: number;
  status: string;
  customerName: string;
  phone: string;
  address: string;
  user: { id: string; email: string; name: string | null };
  items: OrderLine[];
};

type OrderDetail = Omit<OrderRow, "items"> & { items: OrderLine[] };

const statusOptions = ["CREATED", "CONFIRMED", "PAID", "SHIPPED", "DELIVERED", "CANCELLED"] as const;
type OrderStatus = (typeof statusOptions)[number];

export function AdminOrdersPage() {
  const [rows, setRows] = useState<OrderRow[]>([]);
  const [detail, setDetail] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setLoading(true);
    setLoadError(null);
    api
      .get<{ items: OrderRow[] }>("/admin/orders")
      .then((r) => setRows(r.data.items))
      .catch((e: any) => setLoadError(e?.response?.data?.message ?? "Ошибка загрузки"))
      .finally(() => setLoading(false));
  }, []);

  async function openDetail(id: string) {
    setActionError(null);
    try {
      const r = await api.get<OrderDetail>(`/admin/orders/${id}`);
      setDetail(r.data);
    } catch {
      setDetail(null);
    }
  }

  const nextStatuses = useMemo(() => {
    const raw = detail?.status ?? "CREATED";
    const s = (raw === "PENDING" ? "CREATED" : raw) as OrderStatus;
    const map: Record<OrderStatus, OrderStatus[]> = {
      CREATED: ["CONFIRMED", "CANCELLED"],
      CONFIRMED: ["PAID", "CANCELLED"],
      PAID: ["SHIPPED"],
      SHIPPED: ["DELIVERED"],
      DELIVERED: [],
      CANCELLED: []
    };
    return map[s] ?? [];
  }, [detail?.status]);

  async function setStatus(next: OrderStatus) {
    if (!detail) return;
    setBusy(true);
    setActionError(null);
    try {
      const r = await api.patch<OrderDetail>(`/admin/orders/${detail.id}/status`, { status: next });
      setDetail(r.data);
      const list = await api.get<{ items: OrderRow[] }>("/admin/orders");
      setRows(list.data.items);
    } catch (e: any) {
      setActionError(e?.response?.data?.message ?? "Не удалось обновить статус");
    } finally {
      setBusy(false);
    }
  }

  if (loadError) {
    return (
      <div className="card border-red-200 bg-red-50 p-6 text-red-800">
        {loadError}
        <div className="mt-3">
          <Link className="underline" to="/">
            На главную
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="page-title text-violet-950">Все заказы</h2>
          <p className="mt-1 text-sm text-slate-600">Список заказов всех пользователей.</p>
        </div>
        <Link className="btn-secondary" to="/admin/analytics">
          Аналитика
        </Link>
      </div>

      {loading ? <div className="text-slate-600">Загрузка…</div> : null}

      <div className="card overflow-x-auto p-0">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-600">
            <tr>
              <th className="px-4 py-3">Дата</th>
              <th className="px-4 py-3">Пользователь</th>
              <th className="px-4 py-3">Клиент</th>
              <th className="px-4 py-3">Сумма</th>
              <th className="px-4 py-3">Статус</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((o) => (
              <tr key={o.id} className="border-b border-slate-100 hover:bg-slate-50/80">
                <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                  {new Date(o.createdAt).toLocaleString("ru-RU")}
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-900">{o.user.email}</div>
                  <div className="text-xs text-slate-500">{o.user.name ?? "—"}</div>
                </td>
                <td className="px-4 py-3">{o.customerName}</td>
                <td className="px-4 py-3 font-semibold">{formatRub(o.totalRub)}</td>
                <td className="px-4 py-3">
                  <OrderStatusBadge status={o.status} />
                </td>
                <td className="px-4 py-3">
                  <button type="button" className="btn-secondary text-xs" onClick={() => void openDetail(o.id)}>
                    Подробнее
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && !loading ? (
          <div className="p-6 text-sm text-slate-600">Заказов нет.</div>
        ) : null}
      </div>

      {detail ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-4 backdrop-blur-[2px] sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-order-title"
          onClick={() => setDetail(null)}
        >
          <div
            className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xl ring-1 ring-black/5 sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 id="admin-order-title" className="text-lg font-semibold text-slate-900">
                  Заказ
                </h3>
                <div className="mt-1 font-mono text-xs text-slate-500">{detail.id}</div>
              </div>
              <button type="button" className="btn-secondary shrink-0 text-xs" onClick={() => setDetail(null)}>
                Закрыть
              </button>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <OrderStatusBadge status={detail.status} />
              <span className="text-sm text-slate-500">
                {detail.user.email} · {new Date(detail.createdAt).toLocaleString("ru-RU")}
              </span>
            </div>

            <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Этапы выполнения</div>
              <OrderStatusStepper status={detail.status} className="mt-3" />
            </div>

            {actionError ? (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                {actionError}
              </div>
            ) : null}

            {nextStatuses.length ? (
              <div className="mt-5">
                <div className="text-sm font-semibold text-slate-900">Сменить статус</div>
                <p className="mt-1 text-xs text-slate-600">
                  Доступны только следующие шаги по процессу. Отмена возможна до отгрузки.
                </p>
                <ul className="mt-3 grid gap-2">
                  {nextStatuses.map((s) => {
                    const copy = adminActionCopy(s);
                    return (
                      <li key={s}>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void setStatus(s)}
                          className={clsx(
                            "flex w-full flex-col items-start gap-0.5 rounded-xl border px-4 py-3 text-left transition",
                            copy.danger
                              ? "border-red-200 bg-white hover:border-red-300 hover:bg-red-50/80"
                              : "border-slate-200 bg-white hover:border-violet-300 hover:bg-violet-50/50"
                          )}
                        >
                          <span
                            className={clsx(
                              "text-sm font-semibold",
                              copy.danger ? "text-red-900" : "text-violet-950"
                            )}
                          >
                            {copy.title}
                          </span>
                          <span className="text-xs text-slate-600">{copy.subtitle}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : (
              <p className="mt-5 text-sm text-slate-600">
                {detail.status === "CANCELLED"
                  ? "Заказ отменён — действия недоступны."
                  : "Финальный статус — дальнейшие переходы не требуются."}
              </p>
            )}

            <div className="mt-6 grid gap-2 border-t border-slate-200 pt-4 text-sm">
              <div>
                <span className="text-slate-500">Имя: </span>
                {detail.customerName}
              </div>
              <div>
                <span className="text-slate-500">Телефон: </span>
                {detail.phone}
              </div>
              <div>
                <span className="text-slate-500">Адрес: </span>
                {detail.address}
              </div>
            </div>
            <ul className="mt-4 border-t border-slate-200 pt-4 text-sm">
              {detail.items.map((it) => (
                <li key={it.id} className="flex justify-between gap-2 py-1">
                  <span>
                    {it.name}
                    {it.product ? (
                      <span className="ml-1 text-xs text-slate-500">({it.product.category})</span>
                    ) : null}
                  </span>
                  <span className="shrink-0 text-slate-600">
                    {it.quantity} × {formatRub(it.priceRub)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex justify-between border-t border-slate-200 pt-4 text-base font-semibold">
              <span>Итого</span>
              <span>{formatRub(detail.totalRub)}</span>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
