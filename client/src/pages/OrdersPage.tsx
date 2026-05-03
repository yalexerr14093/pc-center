import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { useAuthStore } from "../stores/authStore";
import { formatRub } from "../lib/format";
import { canBuyerCancel } from "../lib/orderStatus";
import { OrderStatusBadge } from "../components/OrderStatusBadge";
import { OrderStatusStepper } from "../components/OrderStatusStepper";

type OrderItem = {
  id: string;
  name: string;
  priceRub: number;
  quantity: number;
};

type Order = {
  id: string;
  createdAt: string;
  totalRub: number;
  status: string;
  customerName: string;
  items: OrderItem[];
};

export function OrdersPage() {
  const token = useAuthStore((s) => s.token);
  const [items, setItems] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    const r = await api.get<{ items: Order[] }>("/orders/my");
    setItems(r.data.items);
  }

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    api
      .get<{ items: Order[] }>("/orders/my")
      .then((r) => setItems(r.data.items))
      .catch((e: any) => setError(e?.response?.data?.message ?? "Не удалось загрузить заказы"))
      .finally(() => setLoading(false));
  }, [token]);

  if (!token) {
    return (
      <div className="card p-6">
        <h2 className="text-xl font-semibold">Мои заказы</h2>
        <p className="mt-2 text-slate-600">
          <Link className="text-emerald-700 underline" to="/auth">
            Войдите
          </Link>
          , чтобы видеть историю.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <div>
        <h2 className="text-2xl font-semibold">Мои заказы</h2>
        <p className="mt-1 text-sm text-slate-600">Статусы заказов и история покупок.</p>
      </div>

      {error ? <div className="card border-red-200 bg-red-50 p-4 text-red-800">{error}</div> : null}
      {loading ? <div className="text-slate-600">Загрузка…</div> : null}

      {!loading && !items.length ? (
        <div className="card p-6 text-slate-600">
          Пока нет заказов.{" "}
          <Link className="text-emerald-700 underline" to="/catalog">
            Каталог
          </Link>
        </div>
      ) : null}

      <div className="grid gap-4">
        {items.map((o) => (
          <article key={o.id} className="card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="font-mono text-xs text-slate-500">{o.id}</div>
                <div className="mt-1 text-sm text-slate-600">
                  {new Date(o.createdAt).toLocaleString("ru-RU")} · {o.customerName}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <OrderStatusBadge status={o.status} />
                <span className="text-lg font-semibold">{formatRub(o.totalRub)}</span>
                {canBuyerCancel(o.status) ? (
                  <button
                    type="button"
                    className="btn-secondary"
                    disabled={busy === o.id}
                    onClick={async () => {
                      setBusy(o.id);
                      setError(null);
                      try {
                        await api.post(`/orders/${o.id}/cancel`);
                        await load();
                      } catch (e: any) {
                        setError(e?.response?.data?.message ?? "Не удалось отменить заказ");
                      } finally {
                        setBusy(null);
                      }
                    }}
                  >
                    Отменить
                  </button>
                ) : null}
              </div>
            </div>
            <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/60 p-3">
              <div className="text-xs font-medium text-slate-500">Прогресс заказа</div>
              <OrderStatusStepper status={o.status} className="mt-2" />
            </div>
            <ul className="mt-4 grid gap-2 border-t border-slate-200 pt-4 text-sm">
              {o.items.map((it) => (
                <li key={it.id} className="flex justify-between gap-3">
                  <span className="text-slate-800">{it.name}</span>
                  <span className="shrink-0 text-slate-600">
                    {it.quantity} × {formatRub(it.priceRub)}
                  </span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </div>
  );
}
