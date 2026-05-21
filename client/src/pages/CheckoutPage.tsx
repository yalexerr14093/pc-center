import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCartStore } from "../stores/cartStore";
import { formatRub } from "../lib/format";
import { api } from "../lib/api";
import { useAuthStore } from "../stores/authStore";

const schema = z.object({
  customerName: z.string().min(2, "Введите имя"),
  phone: z.string().min(6, "Введите телефон"),
  address: z.string().min(8, "Введите адрес")
});

type FormValues = z.infer<typeof schema>;

export function CheckoutPage() {
  const nav = useNavigate();
  const { token } = useAuthStore();
  const items = useCartStore((s) => s.items);
  const totalRub = useCartStore((s) => s.totalRub());
  const clear = useCartStore((s) => s.clear);
  const [serverMsg, setServerMsg] = useState<string | null>(null);
  const [payInfo, setPayInfo] = useState<string | null>(null);

  const payloadItems = useMemo(
    () => items.map((it) => ({ productId: it.product.id, quantity: it.quantity })),
    [items]
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { customerName: "", phone: "", address: "" }
  });

  async function onSubmit(values: FormValues) {
    setServerMsg(null);
    setPayInfo(null);

    if (!token) {
      setServerMsg("Нужна авторизация: войдите или зарегистрируйтесь.");
      nav("/auth");
      return;
    }

    if (!items.length) {
      setServerMsg("Корзина пуста.");
      return;
    }

    try {
      const order = await api.post("/orders", { ...values, items: payloadItems });
      setServerMsg(`Заказ оформлен (№ ${order.data.id}). Менеджер свяжется для подтверждения и оплаты.`);

      try {
        const intent = await api.post("/payments/stripe/create-intent", { amountRub: totalRub });
        setPayInfo(
          intent.data?.clientSecret
            ? "Платёжная сессия создана (тестовый режим Stripe)."
            : "Онлайн-оплата будет доступна после настройки платёжного провайдера."
        );
      } catch {
        setPayInfo("Онлайн-оплата временно недоступна — заказ принят, оплату можно согласовать с менеджером.");
      }

      clear();
    } catch (e: any) {
      setServerMsg(e?.response?.data?.message ?? "Ошибка оформления.");
    }
  }

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <Link to="/cart" className="btn-secondary">
          ← Назад в корзину
        </Link>
        <div className="badge">Итого: {formatRub(totalRub)}</div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-6">
          <h2 className="page-title">Оформление заказа</h2>
          <div className="mt-2 text-sm text-slate-600">
            Укажите контактные данные и адрес доставки. Наличие проверяется при оформлении, а количество списывается сразу,
            чтобы избежать продажи сверх остатка.
          </div>

          <form className="mt-6 grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
            <div>
              <label className="text-xs text-slate-600">Имя</label>
              <input className="input mt-1" {...form.register("customerName")} />
              {form.formState.errors.customerName && (
                <div className="mt-1 text-xs text-red-700">
                  {form.formState.errors.customerName.message}
                </div>
              )}
            </div>

            <div>
              <label className="text-xs text-slate-600">Телефон</label>
              <input className="input mt-1" {...form.register("phone")} />
              {form.formState.errors.phone && (
                <div className="mt-1 text-xs text-red-700">{form.formState.errors.phone.message}</div>
              )}
            </div>

            <div>
              <label className="text-xs text-slate-600">Адрес</label>
              <textarea className="input mt-1 min-h-24" {...form.register("address")} />
              {form.formState.errors.address && (
                <div className="mt-1 text-xs text-red-700">
                  {form.formState.errors.address.message}
                </div>
              )}
            </div>

            <button className="btn-primary" type="submit" disabled={form.formState.isSubmitting}>
              Подтвердить заказ
            </button>

            {serverMsg ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-slate-700">{serverMsg}</div>
            ) : null}
            {payInfo ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-emerald-900">{payInfo}</div>
            ) : null}
            {serverMsg?.includes("Заказ оформлен") ? (
              <Link className="btn-secondary text-center" to="/orders">
                Перейти к моим заказам
              </Link>
            ) : null}
          </form>
        </section>

        <section className="card p-6">
          <h3 className="text-lg font-semibold">Состав заказа</h3>
          <div className="mt-4 grid gap-3">
            {items.map((it) => (
              <div
                key={it.product.id}
                className="flex items-center justify-between gap-3 border-b border-slate-200 pb-3"
              >
                <div className="min-w-0">
                  <div className="truncate font-medium">{it.product.name}</div>
                  <div className="text-sm text-slate-600">
                    {it.quantity} × {formatRub(it.product.priceRub)}
                  </div>
                </div>
                <div className="font-semibold">{formatRub(it.product.priceRub * it.quantity)}</div>
              </div>
            ))}
            <div className="flex items-center justify-between pt-2">
              <div className="text-slate-600">Итого</div>
              <div className="stat-value">{formatRub(totalRub)}</div>
            </div>
          </div>

          {!token && (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
              Чтобы оформить заказ, нужно войти.{" "}
              <Link className="underline" to="/auth">
                Открыть авторизацию
              </Link>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
