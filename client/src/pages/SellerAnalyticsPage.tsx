import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ComposedChart,
  Line
} from "recharts";
import { api } from "../lib/api";
import { useAuthStore } from "../stores/authStore";
import { formatRub } from "../lib/format";
import type { ProductCategory, SellerAnalytics } from "../types";

const catLabel = (c: ProductCategory) =>
  (
    {
      CPU: "Процессоры",
      GPU: "Видеокарты",
      MOTHERBOARD: "Материнские платы",
      RAM: "ОЗУ",
      SSD: "SSD"
    } as const
  )[c];

export function SellerAnalyticsPage() {
  const token = useAuthStore((s) => s.token);
  const [data, setData] = useState<SellerAnalytics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    setError(null);
    api
      .get<SellerAnalytics>("/products/me/analytics")
      .then((r) => setData(r.data))
      .catch((e: any) => setError(e?.response?.data?.message ?? "Не удалось загрузить аналитику"));
  }, [token]);

  const listingChart = useMemo(() => {
    if (!data?.listings.length) return [];
    return [...data.listings]
      .sort((a, b) => b.viewCount - a.viewCount)
      .slice(0, 8)
      .map((l) => ({
        name: l.name.length > 22 ? `${l.name.slice(0, 22)}…` : l.name,
        views: l.viewCount,
        sold: l.soldUnits,
        msgs: l.conversations
      }));
  }, [data]);

  if (!token) {
    return (
      <div className="card p-6">
        <div className="text-xl font-semibold">Аналитика продавца</div>
        <p className="mt-2 text-slate-600">Войдите, чтобы видеть статистику по объявлениям и заказам.</p>
        <Link className="btn-primary mt-4 inline-block" to="/auth">
          Войти
        </Link>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card border-red-200 bg-red-50 p-6 text-red-800">
        {error}
        <div className="mt-3">
          <Link className="underline" to="/my">
            Мои объявления
          </Link>
        </div>
      </div>
    );
  }

  if (!data) {
    return <div className="text-slate-600">Загрузка аналитики…</div>;
  }

  const { summary, listings, ordersByDay, demandIdeas } = data;
  const avgConv =
    summary.totalViews > 0 ? Math.round((summary.soldUnits / summary.totalViews) * 1000) / 10 : 0;

  return (
    <div className="grid gap-8">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h2 className="page-title">Аналитика продавца</h2>
          <p className="mt-1 text-sm text-slate-600">
            Просмотры карточек, продажи и обращения — в духе кабинетов крупных маркетплейсов (данные учебного стенда).
          </p>
        </div>
        <div className="flex min-w-0 flex-wrap gap-2">
          <Link className="btn-secondary" to="/my">
            Мои объявления
          </Link>
          <Link className="btn-primary" to="/sell">
            Новое объявление
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <div className="card p-4">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Лотов всего</div>
          <div className="mt-1 stat-value">{summary.listings}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Активных</div>
          <div className="mt-1 stat-value">{summary.activeListings}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Просмотров</div>
          <div className="mt-1 stat-value">{summary.totalViews}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Продано шт.</div>
          <div className="mt-1 stat-value">{summary.soldUnits}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Диалогов</div>
          <div className="mt-1 stat-value">{summary.conversations}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Выручка</div>
          <div className="mt-1 stat-value">{formatRub(summary.revenueRub)}</div>
          <div className="mt-1 text-xs text-slate-500">По заказам, не отменённым</div>
        </div>
      </div>

      <div className="card p-4">
        <div className="text-sm font-semibold">Конверсия «просмотр → продажа» (оценка)</div>
        <div className="stat-value mt-2 text-emerald-800">{avgConv}%</div>
        <p className="mt-2 text-sm text-slate-600">
          Отношение проданных единиц к сумме просмотров по всем лотам. На демонстрационном стенде просмотр считается при
          открытии карточки товара.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-4">
          <div className="text-sm font-semibold">Заказы за 14 дней</div>
          <div className="mt-4 h-72">
            {ordersByDay.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={ordersByDay.map((d) => ({ ...d, date: d.date.slice(5) }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" allowDecimals={false} />
                  <YAxis yAxisId="right" orientation="right" width={72} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                  <Tooltip
                    formatter={(value, name) =>
                      name === "Выручка, ₽" && typeof value === "number" ? formatRub(value) : value
                    }
                  />
                  <Legend />
                  <Bar yAxisId="left" dataKey="count" name="Заказы" fill="#99f6e4" />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="revenueRub"
                    name="Выручка, ₽"
                    stroke="#4f46e5"
                    strokeWidth={2}
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">Пока нет заказов за период</div>
            )}
          </div>
        </div>

        <div className="card p-4">
          <div className="text-sm font-semibold">Топ лотов по просмотрам</div>
          <div className="mt-4 h-72">
            {listingChart.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={listingChart}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" interval={0} angle={-18} textAnchor="end" height={64} tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="views" name="Просмотры" fill="#14b8a6" />
                  <Bar dataKey="sold" name="Продано шт." fill="#6366f1" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">Нет данных по лотам</div>
            )}
          </div>
        </div>
      </div>

      {demandIdeas.length ? (
        <div className="card p-6">
          <h3 className="text-lg font-semibold">Что востребовано на площадке (30 дней)</h3>
          <p className="mt-1 text-sm text-slate-600">
            Агрегат по всему каталогу — ориентир для следующих объявлений.
          </p>
          <ul className="mt-4 grid gap-3 md:grid-cols-2">
            {demandIdeas.map((d) => (
              <li key={d.category} className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                <div className="font-medium">{catLabel(d.category as ProductCategory)}</div>
                <div className="mt-1 text-sm text-slate-600">Продано единиц: {d.soldUnits30d}</div>
                <div className="mt-2 text-sm text-slate-700">{d.hint}</div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="card p-4 overflow-x-auto">
        <div className="text-sm font-semibold">Все лоты</div>
        <table className="mt-4 w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
            <tr>
              <th className="py-2 pr-3">Название</th>
              <th className="py-2 pr-3">Категория</th>
              <th className="py-2 pr-3">Просмотры</th>
              <th className="py-2 pr-3">Продано</th>
              <th className="py-2 pr-3">Чаты</th>
              <th className="py-2 pr-3">Заказ %</th>
              <th className="py-2 pr-3">Чат %</th>
              <th className="py-2">Статус</th>
            </tr>
          </thead>
          <tbody>
            {listings.map((l) => (
              <tr key={l.id} className="border-b border-slate-100">
                <td className="py-2 pr-3">
                  <Link className="font-medium text-emerald-800 hover:underline" to={`/product/${l.id}`}>
                    {l.name}
                  </Link>
                </td>
                <td className="py-2 pr-3 text-slate-600">{catLabel(l.category)}</td>
                <td className="py-2 pr-3">{l.viewCount}</td>
                <td className="py-2 pr-3">{l.soldUnits}</td>
                <td className="py-2 pr-3">{l.conversations}</td>
                <td className="py-2 pr-3">{l.conversionOrderPct}%</td>
                <td className="py-2 pr-3">{l.conversionMsgPct}%</td>
                <td className="py-2">{l.isHidden ? <span className="badge">Скрыто</span> : <span className="badge">В продаже</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!listings.length ? <div className="mt-4 text-sm text-slate-600">Нет объявлений для статистики.</div> : null}
      </div>
    </div>
  );
}
