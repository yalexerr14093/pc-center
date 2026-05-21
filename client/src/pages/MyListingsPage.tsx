import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import type { Product } from "../types";
import { formatRub } from "../lib/format";

export function MyListingsPage() {
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    setMsg(null);
    setLoading(true);
    try {
      const r = await api.get<{ items: Product[] }>("/products/me/mine");
      setItems(r.data.items);
    } catch (e: any) {
      setMsg(e?.response?.data?.message ?? "Не удалось загрузить объявления");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="page-title">Мои объявления</h2>
          <div className="mt-1 text-sm text-slate-600">
            Здесь можно скрывать, показывать и удалять свои лоты.
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/my/analytics" className="btn-secondary">
            Аналитика
          </Link>
          <Link to="/sell" className="btn-primary">
            Разместить новое
          </Link>
          <button className="btn-secondary" onClick={load} disabled={loading}>
            Обновить
          </button>
        </div>
      </div>

      {msg && <div className="card p-4 text-red-700 border-red-200 bg-red-50">{msg}</div>}

      {loading ? (
        <div className="text-slate-600">Загрузка…</div>
      ) : items.length ? (
        <div className="grid gap-3">
          {items.map((p: any) => (
            <div key={p.id} className="card p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link to={`/product/${p.id}`} className="truncate font-semibold hover:underline">
                      {p.name}
                    </Link>
                    {p.isHidden ? <span className="badge">Скрыто</span> : <span className="badge">Показывается</span>}
                  </div>
                  <div className="mt-1 text-sm text-slate-600">
                    {formatRub(p.priceRub)}
                    {p.city ? ` • ${p.city}` : null}
                    {typeof p.viewCount === "number" ? ` • просмотров: ${p.viewCount}` : null}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {p.isHidden ? (
                    <button
                      className="btn-secondary"
                      onClick={async () => {
                        await api.patch(`/products/${p.id}/unhide`);
                        load();
                      }}
                    >
                      Показать
                    </button>
                  ) : (
                    <button
                      className="btn-secondary"
                      onClick={async () => {
                        await api.patch(`/products/${p.id}/hide`);
                        load();
                      }}
                    >
                      Скрыть
                    </button>
                  )}

                  <button
                    className="btn-secondary"
                    onClick={async () => {
                      if (!confirm("Удалить объявление?")) return;
                      await api.delete(`/products/${p.id}`);
                      load();
                    }}
                  >
                    Удалить
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card p-6 text-slate-600">
          У вас пока нет объявлений. <Link className="underline text-emerald-700" to="/sell">Разместить лот</Link>
        </div>
      )}
    </div>
  );
}

