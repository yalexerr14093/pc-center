import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../lib/api";

type Report = {
  id: string;
  targetType: "PRODUCT" | "CONVERSATION" | "MESSAGE" | "USER";
  reason: string;
  status: "OPEN" | "RESOLVED";
  createdAt: string;
  productId?: string | null;
  conversationId?: string | null;
  messageId?: string | null;
  targetUserId?: string | null;
  reporter: { id: string; email: string; name: string | null };
};

export function AdminReportsPage() {
  const [items, setItems] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const r = await api.get<{ items: Report[] }>("/reports/admin");
    setItems(r.data.items);
  }

  useEffect(() => {
    setLoading(true);
    load()
      .catch((e: any) => setError(e?.response?.data?.message ?? "Ошибка загрузки"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="page-title text-violet-950">Жалобы</h2>
          <p className="mt-1 text-sm text-slate-600">Модерация контента и пользователей.</p>
        </div>
        <Link className="btn-secondary" to="/admin/analytics">
          Аналитика
        </Link>
      </div>

      {error ? <div className="card border-red-200 bg-red-50 p-4 text-red-800">{error}</div> : null}
      {loading ? <div className="text-slate-600">Загрузка…</div> : null}

      <div className="card overflow-x-auto p-0">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-600">
            <tr>
              <th className="px-4 py-3">Дата</th>
              <th className="px-4 py-3">Статус</th>
              <th className="px-4 py-3">Тип</th>
              <th className="px-4 py-3">Кто</th>
              <th className="px-4 py-3">Причина</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((r) => (
              <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50/80">
                <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                  {new Date(r.createdAt).toLocaleString("ru-RU")}
                </td>
                <td className="px-4 py-3">
                  <span className={`badge ${r.status === "OPEN" ? "bg-amber-100 text-amber-900" : ""}`}>
                    {r.status}
                  </span>
                </td>
                <td className="px-4 py-3">{r.targetType}</td>
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-900">{r.reporter.email}</div>
                  <div className="text-xs text-slate-500">{r.reporter.name ?? "—"}</div>
                </td>
                <td className="px-4 py-3 max-w-[420px]">
                  <div className="line-clamp-2 text-slate-800">{r.reason}</div>
                  <div className="mt-1 text-xs text-slate-500 font-mono">
                    {r.productId ?? r.conversationId ?? r.messageId ?? r.targetUserId ?? ""}
                  </div>
                </td>
                <td className="px-4 py-3">
                  {r.status === "OPEN" ? (
                    <button
                      className="btn-secondary text-xs"
                      onClick={async () => {
                        await api.post(`/reports/admin/${r.id}/resolve`);
                        await load();
                      }}
                    >
                      Закрыть
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!items.length && !loading ? <div className="p-6 text-sm text-slate-600">Жалоб нет.</div> : null}
      </div>
    </div>
  );
}

