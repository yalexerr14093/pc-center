import { Link } from "react-router-dom";

export function HomePage() {
  return (
    <div className="grid gap-8">
      <section className="card p-6 md:p-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl">
            <div className="badge mb-4">Маркетплейс комплектующих</div>
            <h1 className="text-3xl font-semibold leading-tight md:text-4xl">
              Покупай и продавай комплектующие.
              <span className="block text-slate-600">
                Объявления пользователей + удобный каталог и детали товара.
              </span>
            </h1>
            <p className="mt-4 text-slate-600">
              Добавляй свои товары через «Разместить», а на странице товара будут показаны фото и все характеристики.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
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

          <div className="grid w-full max-w-md gap-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm text-slate-600">Хиты</div>
              <div className="mt-1 text-lg font-semibold">RTX / Ryzen / NVMe</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm text-slate-600">Доставка</div>
              <div className="mt-1 text-lg font-semibold">по адресу из формы</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm text-slate-600">Оплата</div>
              <div className="mt-1 text-lg font-semibold">карта или по счёту</div>
              <Link className="mt-2 inline-block text-sm text-violet-700 underline" to="/auth">
                кабинет и заказы
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="card p-5">
          <div className="text-sm text-slate-600">Каталог</div>
          <div className="mt-1 font-semibold">5 категорий</div>
          <div className="mt-2 text-sm text-slate-600">CPU, GPU, платы, ОЗУ, SSD.</div>
        </div>
        <div className="card p-5">
          <div className="text-sm text-slate-600">Фильтры</div>
          <div className="mt-1 font-semibold">Поиск и цена</div>
          <div className="mt-2 text-sm text-slate-600">Подбор по бюджету и названию.</div>
        </div>
        <div className="card p-5">
          <div className="text-sm text-slate-600">Корзина</div>
          <div className="mt-1 font-semibold">Количество и сумма</div>
          <div className="mt-2 text-sm text-slate-600">Считает итог автоматически.</div>
        </div>
      </section>
    </div>
  );
}

