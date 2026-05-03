import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../lib/api";
import type { Product, ProductCategory } from "../types";
import { ProductCard } from "../components/ProductCard";

const categories: { id: ProductCategory | "ALL"; label: string }[] = [
  { id: "ALL", label: "Все" },
  { id: "CPU", label: "Процессоры" },
  { id: "GPU", label: "Видеокарты" },
  { id: "MOTHERBOARD", label: "Материнские платы" },
  { id: "RAM", label: "ОЗУ" },
  { id: "SSD", label: "SSD" }
];

const HISTORY_KEY = "pc-center-catalog-search-history";
const SAVED_KEY = "pc-center-catalog-saved-filters";

type SavedFilter = { id: string; name: string; params: Record<string, string> };

function loadHistory(): string[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const v = raw ? JSON.parse(raw) : [];
    return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function saveHistory(items: string[]) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, 12)));
}

function loadSaved(): SavedFilter[] {
  try {
    const raw = localStorage.getItem(SAVED_KEY);
    const v = raw ? JSON.parse(raw) : [];
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

function saveSaved(items: SavedFilter[]) {
  localStorage.setItem(SAVED_KEY, JSON.stringify(items.slice(0, 12)));
}

export function CatalogPage() {
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  const [q, setQ] = useState("");
  const [category, setCategory] = useState<ProductCategory | "ALL">("ALL");
  const [priceMin, setPriceMin] = useState<number | "">("");
  const [priceMax, setPriceMax] = useState<number | "">("");
  const [city, setCity] = useState("");
  const [condition, setCondition] = useState<"" | "NEW" | "LIKE_NEW" | "USED" | "FOR_PARTS">("");
  const [inStock, setInStock] = useState(true);
  const [sort, setSort] = useState<"new" | "price_asc" | "price_desc" | "popular">("new");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const [socketFilter, setSocketFilter] = useState("");
  const [ramTypeFilter, setRamTypeFilter] = useState<"" | "DDR4" | "DDR5">("");
  const [ramMinGb, setRamMinGb] = useState<number | "">("");
  const [ramMaxGb, setRamMaxGb] = useState<number | "">("");
  const [cpuTdpMax, setCpuTdpMax] = useState<number | "">("");
  const [gpuPowerMax, setGpuPowerMax] = useState<number | "">("");
  const [mbFormFactor, setMbFormFactor] = useState("");
  const [ssdMinTb, setSsdMinTb] = useState<number | "">("");
  const [ssdMaxTb, setSsdMaxTb] = useState<number | "">("");
  const [ssdInterface, setSsdInterface] = useState("");

  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [history, setHistory] = useState<string[]>(() => loadHistory());
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>(() => loadSaved());

  const searchWrapRef = useRef<HTMLDivElement>(null);
  const [qDebounced, setQDebounced] = useState(q);

  useEffect(() => {
    const t = window.setTimeout(() => setQDebounced(q), 250);
    return () => window.clearTimeout(t);
  }, [q]);

  useEffect(() => {
    if (qDebounced.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    let ignore = false;
    api
      .get<{ suggestions: string[] }>(`/products/suggest?q=${encodeURIComponent(qDebounced.trim())}`)
      .then((r) => {
        if (!ignore) setSuggestions(r.data.suggestions ?? []);
      })
      .catch(() => {
        if (!ignore) setSuggestions([]);
      });
    return () => {
      ignore = true;
    };
  }, [qDebounced]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      const el = searchWrapRef.current;
      if (el && !el.contains(e.target as Node)) setSuggestOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function pushHistory(term: string) {
    const t = term.trim();
    if (t.length < 2) return;
    const next = [t, ...history.filter((h) => h.toLowerCase() !== t.toLowerCase())];
    setHistory(next);
    saveHistory(next);
  }

  function clearSpecFilters() {
    setSocketFilter("");
    setRamTypeFilter("");
    setRamMinGb("");
    setRamMaxGb("");
    setCpuTdpMax("");
    setGpuPowerMax("");
    setMbFormFactor("");
    setSsdMinTb("");
    setSsdMaxTb("");
    setSsdInterface("");
  }

  function buildParamsRecord(): Record<string, string> {
    const rec: Record<string, string> = {};
    if (q.trim()) rec.q = q.trim();
    if (category !== "ALL") rec.category = category;
    if (priceMin !== "") rec.priceMin = String(priceMin);
    if (priceMax !== "") rec.priceMax = String(priceMax);
    if (city.trim()) rec.city = city.trim();
    if (condition) rec.condition = condition;
    rec.inStock = inStock ? "1" : "0";
    if (sort && sort !== "new") rec.sort = sort;
    if (category !== "ALL") {
      if (socketFilter.trim()) rec.socket = socketFilter.trim();
      if (ramTypeFilter) rec.ramType = ramTypeFilter;
      if (ramMinGb !== "") rec.ramMinGb = String(ramMinGb);
      if (ramMaxGb !== "") rec.ramMaxGb = String(ramMaxGb);
      if (cpuTdpMax !== "") rec.cpuTdpMax = String(cpuTdpMax);
      if (gpuPowerMax !== "") rec.gpuPowerMax = String(gpuPowerMax);
      if (mbFormFactor.trim()) rec.mbFormFactor = mbFormFactor.trim();
      if (ssdMinTb !== "") rec.ssdMinTb = String(ssdMinTb);
      if (ssdMaxTb !== "") rec.ssdMaxTb = String(ssdMaxTb);
      if (ssdInterface.trim()) rec.ssdInterface = ssdInterface.trim();
    }
    return rec;
  }

  function applyParams(rec: Record<string, string>) {
    setQ(rec.q ?? "");
    const c = rec.category as ProductCategory | "ALL" | undefined;
    const nextCat = c && categories.some((x) => x.id === c) ? c : "ALL";
    setCategory(nextCat);
    setPriceMin(rec.priceMin ? Number(rec.priceMin) : "");
    setPriceMax(rec.priceMax ? Number(rec.priceMax) : "");
    setCity(rec.city ?? "");
    setCondition((rec.condition as any) ?? "");
    setInStock(rec.inStock !== "0" && rec.inStock !== "false");
    setSort((rec.sort as any) || "new");
    if (nextCat === "ALL") {
      clearSpecFilters();
    } else {
      setSocketFilter(rec.socket ?? "");
      setRamTypeFilter((rec.ramType as any) ?? "");
      setRamMinGb(rec.ramMinGb ? Number(rec.ramMinGb) : "");
      setRamMaxGb(rec.ramMaxGb ? Number(rec.ramMaxGb) : "");
      setCpuTdpMax(rec.cpuTdpMax ? Number(rec.cpuTdpMax) : "");
      setGpuPowerMax(rec.gpuPowerMax ? Number(rec.gpuPowerMax) : "");
      setMbFormFactor(rec.mbFormFactor ?? "");
      setSsdMinTb(rec.ssdMinTb ? Number(rec.ssdMinTb) : "");
      setSsdMaxTb(rec.ssdMaxTb ? Number(rec.ssdMaxTb) : "");
      setSsdInterface(rec.ssdInterface ?? "");
    }
    setPage(1);
  }

  function saveCurrentFilter() {
    const name = window.prompt("Название набора фильтров", "Мой поиск");
    if (!name?.trim()) return;
    const entry: SavedFilter = { id: crypto.randomUUID(), name: name.trim(), params: buildParamsRecord() };
    const next = [entry, ...savedFilters];
    setSavedFilters(next);
    saveSaved(next);
  }

  function removeSaved(id: string) {
    const next = savedFilters.filter((s) => s.id !== id);
    setSavedFilters(next);
    saveSaved(next);
  }

  const query = useMemo(() => {
    const params = new URLSearchParams();
    const rec = buildParamsRecord();
    for (const [k, v] of Object.entries(rec)) params.set(k, v);
    params.set("page", String(page));
    params.set("limit", "24");
    return params.toString();
  }, [
    q,
    category,
    priceMin,
    priceMax,
    city,
    condition,
    inStock,
    sort,
    page,
    socketFilter,
    ramTypeFilter,
    ramMinGb,
    ramMaxGb,
    cpuTdpMax,
    gpuPowerMax,
    mbFormFactor,
    ssdMinTb,
    ssdMaxTb,
    ssdInterface
  ]);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    api
      .get<{ items: Product[]; total: number }>(`/products${query ? `?${query}` : ""}`)
      .then((r) => {
        if (ignore) return;
        setItems(r.data.items);
        setTotal(r.data.total ?? r.data.items.length);
      })
      .finally(() => {
        if (ignore) return;
        setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [query]);

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Каталог</h2>
          <div className="mt-1 text-sm text-slate-600">
            Поиск с подсказками и сохранённые фильтры; по характеристикам можно сузить выдачу после выбора категории.
          </div>
        </div>
        <div className="badge">Найдено: {total}</div>
      </div>

      <section className="card p-4">
        <div className="grid gap-3 md:grid-cols-6">
          <div className="md:col-span-2">
            <label className="text-xs text-slate-600">Поиск</label>
            <div ref={searchWrapRef} className="relative mt-1">
              <input
                className="input w-full"
                placeholder="Например: Ryzen, RTX, Samsung…"
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setPage(1);
                }}
                onFocus={() => setSuggestOpen(true)}
                onKeyDown={(e) => {
                  if (e.key !== "Enter") return;
                  pushHistory(q);
                  setSuggestOpen(false);
                }}
                autoComplete="off"
              />
              {suggestOpen && (suggestions.length > 0 || history.length > 0) ? (
                <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-72 overflow-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                  {suggestions.length ? (
                    <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                      Подсказки
                    </div>
                  ) : null}
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setQ(s);
                        pushHistory(s);
                        setPage(1);
                        setSuggestOpen(false);
                      }}
                    >
                      {s}
                    </button>
                  ))}
                  {history.length ? (
                    <div className="mt-1 border-t border-slate-100 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                      Недавние
                    </div>
                  ) : null}
                  {history.slice(0, 6).map((s) => (
                    <button
                      key={`h-${s}`}
                      type="button"
                      className="block w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setQ(s);
                        setPage(1);
                        setSuggestOpen(false);
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-600">Категория</label>
            <select
              className="input mt-1"
              value={category}
              onChange={(e) => {
                const v = e.target.value as ProductCategory | "ALL";
                setCategory(v);
                setPage(1);
                if (v === "ALL") clearSpecFilters();
              }}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-600">Город</label>
            <input
              className="input mt-1"
              placeholder="например: Москва"
              value={city}
              onChange={(e) => {
                setCity(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <div>
            <label className="text-xs text-slate-600">Состояние</label>
            <select
              className="input mt-1"
              value={condition}
              onChange={(e) => {
                setCondition(e.target.value as any);
                setPage(1);
              }}
            >
              <option value="">Любое</option>
              <option value="NEW">Новый</option>
              <option value="LIKE_NEW">Как новый</option>
              <option value="USED">Б/у</option>
              <option value="FOR_PARTS">На запчасти</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3 md:col-span-2">
            <div>
              <label className="text-xs text-slate-600">Цена от</label>
              <input
                className="input mt-1"
                inputMode="numeric"
                value={priceMin}
                onChange={(e) => {
                  setPriceMin(e.target.value === "" ? "" : Number(e.target.value));
                  setPage(1);
                }}
              />
            </div>
            <div>
              <label className="text-xs text-slate-600">до</label>
              <input
                className="input mt-1"
                inputMode="numeric"
                value={priceMax}
                onChange={(e) => {
                  setPriceMax(e.target.value === "" ? "" : Number(e.target.value));
                  setPage(1);
                }}
              />
            </div>
          </div>

          <div className="md:col-span-2 flex flex-wrap items-end justify-between gap-3">
            <label className="inline-flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={inStock}
                onChange={(e) => {
                  setInStock(e.target.checked);
                  setPage(1);
                }}
              />
              Только в наличии
            </label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-600">Сортировка</span>
              <select
                className="input"
                value={sort}
                onChange={(e) => {
                  setSort(e.target.value as any);
                  setPage(1);
                }}
              >
                <option value="new">Сначала новые</option>
                <option value="popular">Популярные</option>
                <option value="price_asc">Цена ↑</option>
                <option value="price_desc">Цена ↓</option>
              </select>
            </div>
          </div>
        </div>

        {category === "ALL" ? (
          <p className="mt-3 text-xs text-slate-500">
            Фильтры по сокету, объёму ОЗУ, TDP, SSD и т.п. появятся, когда выберете категорию товаров.
          </p>
        ) : null}

        {category !== "ALL" ? (
          <div className="mt-4 border-t border-slate-100 pt-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Характеристики</div>
            <div className="mt-3 grid gap-3 md:grid-cols-3 lg:grid-cols-6">
              {category === "CPU" || category === "MOTHERBOARD" ? (
              <div>
                <label className="text-xs text-slate-600">Сокет</label>
                <input
                  className="input mt-1"
                  placeholder="AM5, LGA1700…"
                  value={socketFilter}
                  onChange={(e) => {
                    setSocketFilter(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
            ) : null}

              {category === "CPU" ? (
              <div>
                <label className="text-xs text-slate-600">TDP до (Вт)</label>
                <input
                  className="input mt-1"
                  inputMode="numeric"
                  placeholder="65"
                  value={cpuTdpMax}
                  onChange={(e) => {
                    setCpuTdpMax(e.target.value === "" ? "" : Number(e.target.value));
                    setPage(1);
                  }}
                />
              </div>
            ) : null}

              {category === "GPU" ? (
              <div>
                <label className="text-xs text-slate-600">Потребление до (Вт)</label>
                <input
                  className="input mt-1"
                  inputMode="numeric"
                  placeholder="250"
                  value={gpuPowerMax}
                  onChange={(e) => {
                    setGpuPowerMax(e.target.value === "" ? "" : Number(e.target.value));
                    setPage(1);
                  }}
                />
              </div>
            ) : null}

              {category === "MOTHERBOARD" ? (
              <div>
                <label className="text-xs text-slate-600">Форм‑фактор платы</label>
                <input
                  className="input mt-1"
                  placeholder="ATX"
                  value={mbFormFactor}
                  onChange={(e) => {
                    setMbFormFactor(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
            ) : null}

              {category === "RAM" ? (
              <div>
                <label className="text-xs text-slate-600">Тип ОЗУ</label>
                <select
                  className="input mt-1"
                  value={ramTypeFilter}
                  onChange={(e) => {
                    setRamTypeFilter(e.target.value as any);
                    setPage(1);
                  }}
                >
                  <option value="">Любой</option>
                  <option value="DDR4">DDR4</option>
                  <option value="DDR5">DDR5</option>
                </select>
              </div>
            ) : null}

              {category === "RAM" ? (
              <div>
                <label className="text-xs text-slate-600">Объём ОЗУ от (ГБ)</label>
                <input
                  className="input mt-1"
                  inputMode="numeric"
                  value={ramMinGb}
                  onChange={(e) => {
                    setRamMinGb(e.target.value === "" ? "" : Number(e.target.value));
                    setPage(1);
                  }}
                />
              </div>
            ) : null}

              {category === "RAM" ? (
              <div>
                <label className="text-xs text-slate-600">Объём ОЗУ до (ГБ)</label>
                <input
                  className="input mt-1"
                  inputMode="numeric"
                  value={ramMaxGb}
                  onChange={(e) => {
                    setRamMaxGb(e.target.value === "" ? "" : Number(e.target.value));
                    setPage(1);
                  }}
                />
              </div>
            ) : null}

              {category === "SSD" ? (
              <div>
                <label className="text-xs text-slate-600">Объём SSD от (ТБ)</label>
                <input
                  className="input mt-1"
                  inputMode="numeric"
                  step="0.1"
                  value={ssdMinTb}
                  onChange={(e) => {
                    setSsdMinTb(e.target.value === "" ? "" : Number(e.target.value));
                    setPage(1);
                  }}
                />
              </div>
            ) : null}

              {category === "SSD" ? (
              <div>
                <label className="text-xs text-slate-600">Объём SSD до (ТБ)</label>
                <input
                  className="input mt-1"
                  inputMode="numeric"
                  step="0.1"
                  value={ssdMaxTb}
                  onChange={(e) => {
                    setSsdMaxTb(e.target.value === "" ? "" : Number(e.target.value));
                    setPage(1);
                  }}
                />
              </div>
            ) : null}

              {category === "SSD" ? (
              <div className="md:col-span-2">
                <label className="text-xs text-slate-600">Интерфейс SSD</label>
                <input
                  className="input mt-1"
                  placeholder="NVMe"
                  value={ssdInterface}
                  onChange={(e) => {
                    setSsdInterface(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
            ) : null}
            </div>
          </div>
        ) : null}

        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
          <button type="button" className="btn-secondary" onClick={saveCurrentFilter}>
            Сохранить фильтры
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              applyParams({});
              setSocketFilter("");
              setRamTypeFilter("");
              setRamMinGb("");
              setRamMaxGb("");
              setCpuTdpMax("");
              setGpuPowerMax("");
              setMbFormFactor("");
              setSsdMinTb("");
              setSsdMaxTb("");
              setSsdInterface("");
              setCategory("ALL");
              setSort("new");
              setInStock(true);
            }}
          >
            Сбросить всё
          </button>
        </div>

        {savedFilters.length ? (
          <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50/80 p-3">
            <div className="text-xs font-semibold text-slate-600">Сохранённые наборы</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {savedFilters.map((s) => (
                <div key={s.id} className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-1 text-sm">
                  <button
                    type="button"
                    className="font-medium text-emerald-800 hover:underline"
                    onClick={() => applyParams(s.params)}
                  >
                    {s.name}
                  </button>
                  <button type="button" className="text-slate-400 hover:text-red-600" onClick={() => removeSaved(s.id)} aria-label="Удалить">
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      {loading ? (
        <div className="text-slate-600">Загрузка…</div>
      ) : items.length ? (
        <div className="grid gap-4">
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </section>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-slate-600">
              Показано: {items.length} из {total}
            </div>
            <div className="flex gap-2">
              <button className="btn-secondary" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                ← Назад
              </button>
              <div className="badge">Стр. {page}</div>
              <button
                className="btn-secondary"
                disabled={page * 24 >= total}
                onClick={() => setPage((p) => p + 1)}
              >
                Вперёд →
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="card p-6 text-slate-600">Ничего не найдено.</div>
      )}
    </div>
  );
}
