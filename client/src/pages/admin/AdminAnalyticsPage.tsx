import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar
} from "recharts";
import { api } from "../../lib/api";
import { formatRub } from "../../lib/format";

type Analytics = {
  summary: {
    totalUsers: number;
    totalOrders: number;
    distinctBuyers: number;
    last30Days: {
      newUsers: number;
      orders: number;
      itemsSold: number;
      revenueRub: number;
    };
  };
  series: {
    usersPerDay: Array<{ date: string; count: number }>;
    ordersPerDay: Array<{ date: string; count: number; revenueRub: number }>;
  };
  ordersByCategory: Array<{ category: string; quantity: number; revenue: number }>;
  topProducts: Array<{ productId: string; name: string; quantity: number; revenue: number }>;
};

const chartWrap = "card p-4";

export function AdminAnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<Analytics>("/admin/analytics")
      .then((r) => setData(r.data))
      .catch((e: any) => setError(e?.response?.data?.message ?? "Нет доступа или ошибка загрузки"));
  }, []);

  if (error) {
    return (
      <div className="card border-red-200 bg-red-50 p-6 text-red-800">
        {error}
        <div className="mt-3">
          <Link className="underline" to="/">
            На главную
          </Link>
        </div>
      </div>
    );
  }

  if (!data) {
    return <div className="text-slate-600">Загрузка аналитики…</div>;
  }

  const { summary, series, ordersByCategory, topProducts } = data;
  const mergedSeries = series.usersPerDay.map((u, i) => ({
    date: u.date.slice(5),
    users: u.count,
    orders: series.ordersPerDay[i]?.count ?? 0,
    revenue: series.ordersPerDay[i]?.revenueRub ?? 0
  }));

  return (
    <div className="grid gap-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="page-title text-violet-950">Аналитика</h2>
          <p className="mt-1 text-sm text-slate-600">Сводка по пользователям и заказам за последние 30 дней.</p>
        </div>
        <div className="flex gap-2 text-sm">
          <Link className="btn-secondary" to="/admin/chats">
            Все чаты
          </Link>
          <Link className="btn-secondary" to="/admin/orders">
            Все заказы
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className={chartWrap}>
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Пользователей всего</div>
          <div className="stat-value mt-1 text-slate-900">{summary.totalUsers}</div>
        </div>
        <div className={chartWrap}>
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Заказов всего</div>
          <div className="stat-value mt-1 text-slate-900">{summary.totalOrders}</div>
        </div>
        <div className={chartWrap}>
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Покупателей (уник.)</div>
          <div className="stat-value mt-1 text-slate-900">{summary.distinctBuyers}</div>
        </div>
        <div className={chartWrap}>
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Оборот за 30 дней</div>
          <div className="stat-value mt-1 text-slate-900">
            {formatRub(summary.last30Days.revenueRub)}
          </div>
          <div className="mt-1 text-xs text-slate-600">по суммам заказов</div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className={chartWrap}>
          <h3 className="mb-4 text-sm font-semibold text-slate-800">Новые пользователи по дням</h3>
          <div className="h-72 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series.usersPerDay.map((d) => ({ ...d, date: d.date.slice(5) }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="count" name="Регистрации" stroke="#7c3aed" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={chartWrap}>
          <h3 className="mb-4 text-sm font-semibold text-slate-800">Заказы по дням</h3>
          <div className="h-72 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mergedSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="orders" name="Заказы" stroke="#0d9488" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className={chartWrap}>
        <h3 className="mb-4 text-sm font-semibold text-slate-800">Оборот по дням</h3>
        <div className="h-72 w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={mergedSeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
              <Tooltip />
              <Legend />
              <Bar dataKey="revenue" name="₽ за день" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className={chartWrap}>
          <h3 className="mb-4 text-sm font-semibold text-slate-800">Позиции по категориям (30 дн.)</h3>
          <div className="h-80 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ordersByCategory} layout="vertical" margin={{ left: 8, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" allowDecimals={false} />
                <YAxis type="category" dataKey="category" width={100} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="quantity" name="Шт." fill="#14b8a6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={chartWrap}>
          <h3 className="mb-4 text-sm font-semibold text-slate-800">Топ товаров по количеству (30 дн.)</h3>
          <div className="h-80 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProducts.slice(0, 8)} margin={{ bottom: 48, left: 8, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" angle={-28} textAnchor="end" interval={0} height={70} tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="quantity" name="Шт." fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
