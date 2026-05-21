import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, resolveAssetUrl } from "../lib/api";
import type { Product } from "../types";
import { formatRub } from "../lib/format";
import { useCartStore } from "../stores/cartStore";
import { placeholderImageDataUrl } from "../lib/placeholderImage";
import { useAuthStore } from "../stores/authStore";

function toEntries(specs: unknown): Array<[string, unknown]> {
  if (!specs || typeof specs !== "object" || Array.isArray(specs)) return [];
  return Object.entries(specs as Record<string, unknown>);
}

const conditionLabel: Record<string, string> = {
  NEW: "Новый",
  LIKE_NEW: "Как новый",
  USED: "Б/у",
  FOR_PARTS: "На запчасти"
};

export function ProductPage() {
  const { id } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const add = useCartStore((s) => s.add);
  const cartItems = useCartStore((s) => s.items);
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [warn, setWarn] = useState<string | null>(null);
  const token = useAuthStore((s) => s.token);
  const userId = useAuthStore((s) => s.userId);
  const nav = useNavigate();
  const [reportMsg, setReportMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let ignore = false;
    setLoading(true);
    api
      .get<Product>(`/products/${id}`)
      .then((r) => {
        if (ignore) return;
        setProduct(r.data);
        setActiveImage(r.data.imageUrl);
      })
      .finally(() => {
        if (ignore) return;
        setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [id]);

  if (loading) return <div className="text-slate-600">Загрузка…</div>;
  if (!product) return <div className="card p-6 text-slate-600">Товар не найден.</div>;

  const imagesRaw = (product.imageUrls?.length ? product.imageUrls : [product.imageUrl]).filter(Boolean);
  const images = imagesRaw.map(resolveAssetUrl);
  const initial = resolveAssetUrl(product.imageUrl);
  const active = activeImage && images.includes(activeImage) ? activeImage : images[0] ?? initial;
  const specsEntries = toEntries(product.specs);
  const inCartQty = cartItems.find((i) => i.product.id === product.id)?.quantity ?? 0;

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <Link to="/catalog" className="btn-secondary">
          ← Назад в каталог
        </Link>
        <Link to="/cart" className="btn-primary">
          В корзину →
        </Link>
      </div>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="card">
          <div className="aspect-[4/3] bg-slate-100">
            <img
              src={active}
              alt={product.name}
              className="h-full w-full object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = placeholderImageDataUrl;
              }}
            />
          </div>
          {images.length > 1 && (
            <div className="grid grid-cols-4 gap-2 p-3">
              {images.slice(0, 8).map((src) => (
                <button
                  key={src}
                  className={`aspect-[4/3] overflow-hidden rounded-xl border ${
                    src === active ? "border-emerald-500" : "border-slate-200"
                  } bg-slate-100`}
                  onClick={() => setActiveImage(src)}
                  type="button"
                >
                  <img src={src} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="card p-6">
          <h2 className="page-title break-words">{product.name}</h2>
          <div className="mt-2 text-slate-600">{product.description}</div>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-slate-600">
            {product.city ? <span className="badge">Город: {product.city}</span> : null}
            {product.condition ? (
              <span className="badge">Состояние: {conditionLabel[product.condition] ?? product.condition}</span>
            ) : null}
            {product.seller ? (
              <Link className="badge hover:underline" to={`/seller/${product.seller.id}`}>
                Продавец:{" "}
                {product.seller.name ? product.seller.name : `Пользователь #${product.seller.id.slice(0, 6)}`}
              </Link>
            ) : (
              <span className="badge">Магазин</span>
            )}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <div className="text-3xl font-semibold">{formatRub(product.priceRub)}</div>
            <span className="badge">В наличии: {product.stock}</span>
          </div>

          <button
            className="btn-primary mt-6 w-full"
            onClick={() => {
              const res = add(product, 1);
              if (res.capped) {
                setWarn(`Доступно только ${res.max} шт.`);
                window.setTimeout(() => setWarn(null), 2500);
              } else {
                setWarn(null);
              }
            }}
            disabled={product.stock <= 0}
          >
            {product.stock > 0 ? "Добавить в корзину" : "Нет в наличии"}
          </button>
          {warn ? <div className="mt-3 text-sm text-amber-700">{warn}</div> : null}
          {product.stock > 0 ? (
            <div className="mt-2 text-xs text-slate-600">
              В корзине: {inCartQty} • Доступно: {product.stock}
            </div>
          ) : null}

          {product.seller?.id && product.seller.id !== userId ? (
            <button
              className="btn-secondary mt-3 w-full"
              onClick={async () => {
                if (!token) return nav("/auth");
                const r = await api.post("/conversations", { productId: product.id });
                nav(`/messages?c=${r.data.id}`);
              }}
            >
              Написать продавцу
            </button>
          ) : null}

          <button
            className="btn-secondary mt-3 w-full"
            onClick={async () => {
              setReportMsg(null);
              if (!token) return nav("/auth");
              const reason = window.prompt("Опишите причину жалобы (например: мошенничество, неактуальная цена и т.д.)");
              if (!reason?.trim()) return;
              try {
                await api.post("/reports", { targetType: "PRODUCT", targetId: product.id, reason: reason.trim() });
                setReportMsg("Жалоба отправлена. Спасибо!");
                window.setTimeout(() => setReportMsg(null), 2500);
              } catch (e: any) {
                setReportMsg(e?.response?.data?.message ?? "Не удалось отправить жалобу");
              }
            }}
          >
            Пожаловаться
          </button>
          {reportMsg ? <div className="mt-2 text-sm text-slate-600">{reportMsg}</div> : null}

          <div className="mt-6">
            <div className="text-sm font-semibold">Характеристики</div>
            {specsEntries.length ? (
              <div className="mt-2 overflow-hidden rounded-xl border border-slate-200">
                <table className="w-full text-sm">
                  <tbody>
                    {specsEntries.map(([k, v]) => (
                      <tr key={k} className="border-t border-slate-200 first:border-t-0">
                        <td className="w-1/2 bg-slate-50 px-3 py-2 text-slate-600">{k}</td>
                        <td className="px-3 py-2 text-slate-900">{typeof v === "string" ? v : JSON.stringify(v)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                Характеристики не указаны.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

