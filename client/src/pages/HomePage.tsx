import { Link } from "react-router-dom";

export function HomePage() {
  return (
    <div className="grid gap-8">
      <section className="card p-4 sm:p-6 md:p-10">
        <div className="flex min-w-0 flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0 max-w-2xl">
            <div className="badge mb-3 sm:mb-4">Маркетплейс комплектующих</div>
            <h1 className="text-[clamp(1.35rem,1rem+2.2vw,2.25rem)] font-semibold leading-[1.15] tracking-tight">
              Покупай и продавай комплектующие.
              <span className="mt-1 block text-[0.92em] font-normal text-slate-600">
                Объявления пользователей + удобный каталог и детали товара.
              </span>
            </h1>
            <p className="mt-3 max-w-prose text-slate-600 sm:mt-4 sm:text-[0.9375rem]">
              Добавляй свои товары через «Разместить», а на странице товара будут показаны фото и все характеристики.
            </p>
            <div className="mt-5 flex min-w-0 flex-wrap gap-2 sm:mt-6 sm:gap-3">
              <Link to="/catalog" className="btn-primary">
                Перейти в каталог
              </Link>
              <Link to="/sell" className="btn-secondary">
                Разместить объявление
              </Link>
              <Link to="/cart" className="btn-secondary">
                Открыть корзину
              </Link>
            </div>
          </div>

          <div className="grid w-full min-w-0 max-w-md gap-2 sm:gap-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:p-4">
              <div className="text-xs text-slate-600 sm:text-sm">Хиты</div>
              <div className="mt-1 text-base font-semibold sm:text-lg">RTX / Ryzen / NVMe</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:p-4">
              <div className="text-xs text-slate-600 sm:text-sm">Доставка</div>
              <div className="mt-1 text-base font-semibold sm:text-lg">по адресу из формы</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:p-4">
              <div className="text-xs text-slate-600 sm:text-sm">Оплата</div>
              <div className="mt-1 text-base font-semibold sm:text-lg">карта или по счёту</div>
              <Link className="mt-2 inline-block text-sm text-violet-700 underline" to="/auth">
                кабинет и заказы
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="grid min-w-0 gap-3 sm:gap-4 md:grid-cols-3">
        <div className="card min-w-0 p-4 sm:p-5">
          <div className="text-sm text-slate-600">Каталог</div>
          <div className="mt-1 font-semibold">5 категорий</div>
          <div className="mt-2 text-sm text-slate-600">CPU, GPU, платы, ОЗУ, SSD.</div>
        </div>
        <div className="card min-w-0 p-4 sm:p-5">
          <div className="text-sm text-slate-600">Фильтры</div>
          <div className="mt-1 font-semibold">Поиск и цена</div>
          <div className="mt-2 text-sm text-slate-600">Подбор по бюджету и названию.</div>
        </div>
        <div className="card min-w-0 p-4 sm:p-5">
          <div className="text-sm text-slate-600">Корзина</div>
          <div className="mt-1 font-semibold">Количество и сумма</div>
          <div className="mt-2 text-sm text-slate-600">Считает итог автоматически.</div>
        </div>
      </section>
    </div>
  );
}

