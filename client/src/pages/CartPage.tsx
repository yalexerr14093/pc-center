import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCartStore } from "../stores/cartStore";
import { useAuthStore } from "../stores/authStore";
import { formatRub } from "../lib/format";

export function CartPage() {
  const token = useAuthStore((s) => s.token);
  const items = useCartStore((s) => s.items);
  const setQty = useCartStore((s) => s.setQty);
  const remove = useCartStore((s) => s.remove);
  const total = useCartStore((s) => s.totalRub());
  const nav = useNavigate();
  const [warnings, setWarnings] = useState<Record<string, string>>({});

  useEffect(() => {
    // clean warnings for removed items
    setWarnings((prev) => {
      const ids = new Set(items.map((i) => i.product.id));
      const next: Record<string, string> = {};
      for (const [k, v] of Object.entries(prev)) {
        if (ids.has(k)) next[k] = v;
      }
      return next;
    });
  }, [items]);

  if (!token) {
    return (
      <div className="card p-6">
        <h2 className="text-2xl font-semibold">Корзина</h2>
        <div className="mt-2 text-slate-600">
          Нужно войти в аккаунт, чтобы посмотреть корзину.
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link to="/auth" className="btn-primary">
            Войти
          </Link>
          <Link to="/catalog" className="btn-secondary">
            Перейти в каталог
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Корзина</h2>
          <div className="mt-1 text-sm text-slate-600">Управляй количеством и смотри итог.</div>
        </div>
        <Link to="/catalog" className="btn-secondary">
          Добавить ещё
        </Link>
      </div>

      {items.length ? (
        <div className="grid gap-4">
          {items.map((it) => (
            <div key={it.product.id} className="card p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="truncate text-base font-semibold">{it.product.name}</div>
                  <div className="mt-1 text-sm text-slate-600">{formatRub(it.product.priceRub)} / шт</div>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    className="input w-24 text-center"
                    inputMode="numeric"
                    min={1}
                    max={it.product.stock}
                    value={it.quantity}
                    onChange={(e) => {
                      const raw = Number(e.target.value);
                      const stock = Math.max(1, Math.floor(it.product.stock ?? 1));
                      if (Number.isFinite(raw) && raw > stock) {
                        setWarnings((prev) => ({
                          ...prev,
                          [it.product.id]: `Доступно только ${stock} шт.`
                        }));
                        window.setTimeout(() => {
                          setWarnings((prev) => {
                            const { [it.product.id]: _ignore, ...rest } = prev;
                            return rest;
                          });
                        }, 2500);
                      }
                      setQty(it.product.id, raw);
                    }}
                  />
                  <div className="text-xs text-slate-600">
                    из {it.product.stock}
                  </div>
                  {warnings[it.product.id] ? (
                    <div className="text-xs text-amber-700">{warnings[it.product.id]}</div>
                  ) : null}
                  <div className="w-32 text-right font-semibold">
                    {formatRub(it.product.priceRub * it.quantity)}
                  </div>
                  <button className="btn-secondary" onClick={() => remove(it.product.id)}>
                    Удалить
                  </button>
                </div>
              </div>
            </div>
          ))}

          <div className="card p-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-slate-600">Итого</div>
            <div className="text-2xl font-semibold">{formatRub(total)}</div>
            <button
              className="btn-primary"
              onClick={() => nav("/checkout")}
              disabled={items.length === 0}
            >
              Оформить заказ
            </button>
          </div>
        </div>
      ) : (
        <div className="card p-6 text-slate-600">
          Корзина пуста. <Link className="text-emerald-700 underline" to="/catalog">Перейти в каталог</Link>
        </div>
      )}
    </div>
  );
}

