import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../lib/api";
import type { SellerProfile } from "../types";
import { ProductCard } from "../components/ProductCard";

export function SellerPage() {
  const { id } = useParams();
  const [data, setData] = useState<SellerProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setError(null);
    api
      .get<SellerProfile>(`/users/${id}`)
      .then((r) => setData(r.data))
      .catch((e: any) => setError(e?.response?.data?.message ?? "Не удалось загрузить продавца"));
  }, [id]);

  if (error) {
    return <div className="card p-6 text-red-700 border border-red-200 bg-red-50">{error}</div>;
  }
  if (!data) return <div className="text-slate-600">Загрузка…</div>;

  const name = data.user.name ?? `Пользователь #${data.user.id.slice(0, 6)}`;
  const avg = data.stats.ratingAvg ? data.stats.ratingAvg.toFixed(1) : "—";

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <Link to="/catalog" className="btn-secondary">
          ← В каталог
        </Link>
      </div>

      <section className="card p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold">{name}</h2>
            <div className="mt-1 text-sm text-slate-600">
              На площадке с {new Date(data.user.createdAt).toLocaleDateString("ru-RU")}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="badge">Рейтинг: {avg}</span>
            <span className="badge">Отзывов: {data.stats.reviewsCount}</span>
          </div>
        </div>
      </section>

      <section className="grid gap-4">
        <h3 className="text-lg font-semibold">Объявления продавца</h3>
        {data.products.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <div className="card p-6 text-slate-600">Пока нет активных объявлений.</div>
        )}
      </section>

      <section className="grid gap-4">
        <h3 className="text-lg font-semibold">Отзывы</h3>
        {data.reviews.length ? (
          <div className="grid gap-3">
            {data.reviews.map((r) => (
              <div key={r.id} className="card p-4">
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <div className="text-slate-600">
                    {r.buyer.name ?? `Покупатель #${r.buyer.id.slice(0, 6)}`} ·{" "}
                    {new Date(r.createdAt).toLocaleString("ru-RU")}
                  </div>
                  <div className="badge">★ {r.rating}/5</div>
                </div>
                {r.text ? <div className="mt-2 text-slate-800">{r.text}</div> : null}
              </div>
            ))}
          </div>
        ) : (
          <div className="card p-6 text-slate-600">Отзывов пока нет.</div>
        )}
      </section>
    </div>
  );
}

