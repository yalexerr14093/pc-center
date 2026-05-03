import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useAuthStore } from "../stores/authStore";
import type { ProductCategory, ProductCondition } from "../types";

const categories: { id: ProductCategory; label: string }[] = [
  { id: "CPU", label: "Процессор" },
  { id: "GPU", label: "Видеокарта" },
  { id: "MOTHERBOARD", label: "Материнская плата" },
  { id: "RAM", label: "ОЗУ" },
  { id: "SSD", label: "SSD" }
];

const conditions: { id: ProductCondition; label: string }[] = [
  { id: "NEW", label: "Новый" },
  { id: "LIKE_NEW", label: "Как новый" },
  { id: "USED", label: "Б/у" },
  { id: "FOR_PARTS", label: "На запчасти" }
];

export function SellPage() {
  const nav = useNavigate();
  const token = useAuthStore((s) => s.token);

  const [name, setName] = useState("");
  const [category, setCategory] = useState<ProductCategory>("CPU");
  const [priceRub, setPriceRub] = useState<number | "">("");
  const [stock, setStock] = useState<number | "">(1);
  const [city, setCity] = useState("");
  const [condition, setCondition] = useState<ProductCondition>("USED");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<File[]>([]);

  // Common specs
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");

  // CPU
  const [socket, setSocket] = useState("");
  const [cores, setCores] = useState<number | "">("");
  const [threads, setThreads] = useState<number | "">("");
  const [tdpW, setTdpW] = useState<number | "">("");

  // GPU
  const [vram, setVram] = useState("");
  const [powerW, setPowerW] = useState<number | "">("");
  const [rayTracing, setRayTracing] = useState(false);

  // Motherboard
  const [chipset, setChipset] = useState("");
  const [formFactor, setFormFactor] = useState("");
  const [wifi, setWifi] = useState(false);

  // RAM
  const [ramType, setRamType] = useState("");
  const [capacityGb, setCapacityGb] = useState<number | "">("");
  const [speedMt, setSpeedMt] = useState<number | "">("");

  // SSD
  const [ssdInterface, setSsdInterface] = useState("");
  const [capacityTb, setCapacityTb] = useState<number | "">("");
  const [readMb, setReadMb] = useState<number | "">("");
  const [writeMb, setWriteMb] = useState<number | "">("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const previews = useMemo(() => images.map((f) => ({ file: f, url: URL.createObjectURL(f) })), [images]);

  if (!token) {
    return (
      <div className="card p-6">
        <div className="text-xl font-semibold">Разместить объявление</div>
        <div className="mt-2 text-slate-600">Нужно войти в аккаунт, чтобы публиковать товары.</div>
        <button className="btn-primary mt-4" onClick={() => nav("/auth")}>
          Войти
        </button>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold">Разместить объявление</h2>
          <div className="mt-1 text-sm text-slate-600">
            Добавьте фото, цену и характеристики — они будут показаны на странице товара.
          </div>
        </div>
      </div>

      <section className="card p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-xs text-slate-600">Название</label>
            <input className="input mt-1" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-600">Категория</label>
              <select
                className="input mt-1"
                value={category}
                onChange={(e) => setCategory(e.target.value as ProductCategory)}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-600">Состояние</label>
              <select
                className="input mt-1"
                value={condition}
                onChange={(e) => setCondition(e.target.value as ProductCondition)}
              >
                {conditions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 md:col-span-2">
            <div>
              <label className="text-xs text-slate-600">Цена (₽)</label>
              <input
                className="input mt-1"
                inputMode="numeric"
                value={priceRub}
                onChange={(e) => setPriceRub(e.target.value === "" ? "" : Number(e.target.value))}
              />
            </div>
            <div>
              <label className="text-xs text-slate-600">Город</label>
              <input className="input mt-1" value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="text-xs text-slate-600">Количество в наличии</label>
            <input
              className="input mt-1"
              inputMode="numeric"
              value={stock}
              onChange={(e) => setStock(e.target.value === "" ? "" : Number(e.target.value))}
            />
            <div className="mt-2 text-xs text-slate-600">Например: 1, 2, 5…</div>
          </div>

          <div className="md:col-span-2">
            <label className="text-xs text-slate-600">Описание</label>
            <textarea
              className="input mt-1 min-h-32"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-xs text-slate-600">Фотографии</label>
            <input
              className="input mt-1"
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => {
                const next = Array.from(e.target.files ?? []);
                setImages(next.slice(0, 10));
              }}
            />
            {previews.length ? (
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {previews.slice(0, 8).map((p) => (
                  <div key={p.url} className="aspect-[4/3] overflow-hidden rounded-xl bg-slate-100">
                    <img className="h-full w-full object-cover" src={p.url} alt="" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-2 text-xs text-slate-600">Добавь 1–10 фото (первое будет главным).</div>
            )}
          </div>

          <div className="md:col-span-2">
            <div className="text-sm font-semibold">Характеристики</div>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div>
                <label className="text-xs text-slate-600">Бренд</label>
                <input className="input mt-1" value={brand} onChange={(e) => setBrand(e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-slate-600">Модель</label>
                <input className="input mt-1" value={model} onChange={(e) => setModel(e.target.value)} />
              </div>

              {category === "CPU" && (
                <>
                  <div>
                    <label className="text-xs text-slate-600">Сокет</label>
                    <input className="input mt-1" value={socket} onChange={(e) => setSocket(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs text-slate-600">Ядра</label>
                      <input
                        className="input mt-1"
                        inputMode="numeric"
                        value={cores}
                        onChange={(e) => setCores(e.target.value === "" ? "" : Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-600">Потоки</label>
                      <input
                        className="input mt-1"
                        inputMode="numeric"
                        value={threads}
                        onChange={(e) => setThreads(e.target.value === "" ? "" : Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-600">TDP (W)</label>
                      <input
                        className="input mt-1"
                        inputMode="numeric"
                        value={tdpW}
                        onChange={(e) => setTdpW(e.target.value === "" ? "" : Number(e.target.value))}
                      />
                    </div>
                  </div>
                </>
              )}

              {category === "GPU" && (
                <>
                  <div>
                    <label className="text-xs text-slate-600">Видеопамять</label>
                    <input className="input mt-1" value={vram} onChange={(e) => setVram(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-600">Потребление (W)</label>
                      <input
                        className="input mt-1"
                        inputMode="numeric"
                        value={powerW}
                        onChange={(e) => setPowerW(e.target.value === "" ? "" : Number(e.target.value))}
                      />
                    </div>
                    <div className="flex items-end gap-2">
                      <label className="flex items-center gap-2 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          checked={rayTracing}
                          onChange={(e) => setRayTracing(e.target.checked)}
                        />
                        Ray Tracing
                      </label>
                    </div>
                  </div>
                </>
              )}

              {category === "MOTHERBOARD" && (
                <>
                  <div>
                    <label className="text-xs text-slate-600">Сокет</label>
                    <input className="input mt-1" value={socket} onChange={(e) => setSocket(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs text-slate-600">Чипсет</label>
                    <input className="input mt-1" value={chipset} onChange={(e) => setChipset(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs text-slate-600">Форм‑фактор</label>
                    <input className="input mt-1" value={formFactor} onChange={(e) => setFormFactor(e.target.value)} />
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-2 text-sm text-slate-700">
                      <input type="checkbox" checked={wifi} onChange={(e) => setWifi(e.target.checked)} />
                      Wi‑Fi
                    </label>
                  </div>
                </>
              )}

              {category === "RAM" && (
                <>
                  <div>
                    <label className="text-xs text-slate-600">Тип</label>
                    <input className="input mt-1" value={ramType} onChange={(e) => setRamType(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs text-slate-600">Объём (GB)</label>
                      <input
                        className="input mt-1"
                        inputMode="numeric"
                        value={capacityGb}
                        onChange={(e) => setCapacityGb(e.target.value === "" ? "" : Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-600">Частота (MT/s)</label>
                      <input
                        className="input mt-1"
                        inputMode="numeric"
                        value={speedMt}
                        onChange={(e) => setSpeedMt(e.target.value === "" ? "" : Number(e.target.value))}
                      />
                    </div>
                  </div>
                </>
              )}

              {category === "SSD" && (
                <>
                  <div>
                    <label className="text-xs text-slate-600">Интерфейс</label>
                    <input className="input mt-1" value={ssdInterface} onChange={(e) => setSsdInterface(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs text-slate-600">Объём (TB)</label>
                      <input
                        className="input mt-1"
                        inputMode="numeric"
                        value={capacityTb}
                        onChange={(e) => setCapacityTb(e.target.value === "" ? "" : Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-600">Чтение (MB/s)</label>
                      <input
                        className="input mt-1"
                        inputMode="numeric"
                        value={readMb}
                        onChange={(e) => setReadMb(e.target.value === "" ? "" : Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-600">Запись (MB/s)</label>
                      <input
                        className="input mt-1"
                        inputMode="numeric"
                        value={writeMb}
                        onChange={(e) => setWriteMb(e.target.value === "" ? "" : Number(e.target.value))}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {error && <div className="mt-4 rounded-xl border border-red-400/30 bg-red-500/10 p-3 text-sm">{error}</div>}

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            className="btn-primary"
            disabled={loading}
            onClick={async () => {
              setError(null);
              try {
                if (!name.trim()) return setError("Введите название");
                if (!description.trim() || description.trim().length < 10)
                  return setError("Описание должно быть не короче 10 символов");
                if (priceRub === "" || !Number.isFinite(priceRub) || priceRub <= 0)
                  return setError("Укажите корректную цену");
                if (stock === "" || !Number.isFinite(stock) || stock < 1 || stock > 999)
                  return setError("Укажите количество (1–999)");
                if (!images.length) return setError("Добавьте хотя бы 1 фото");

                setLoading(true);
                const fd = new FormData();
                fd.set("name", name);
                fd.set("category", category);
                fd.set("priceRub", String(priceRub));
                fd.set("stock", String(stock));
                fd.set("condition", condition);
                fd.set("description", description);
                if (city.trim()) fd.set("city", city.trim());

                for (const img of images) fd.append("images", img);

                const setSpec = (key: string, value: unknown) => {
                  if (value === "" || value == null) return;
                  fd.set(`spec_${key}`, String(value));
                };

                setSpec("brand", brand);
                setSpec("model", model);

                if (category === "CPU") {
                  setSpec("socket", socket);
                  setSpec("cores", cores);
                  setSpec("threads", threads);
                  setSpec("tdpW", tdpW);
                }
                if (category === "GPU") {
                  setSpec("vram", vram);
                  setSpec("powerW", powerW);
                  setSpec("rayTracing", rayTracing);
                }
                if (category === "MOTHERBOARD") {
                  setSpec("socket", socket);
                  setSpec("chipset", chipset);
                  setSpec("formFactor", formFactor);
                  setSpec("wifi", wifi);
                }
                if (category === "RAM") {
                  setSpec("type", ramType);
                  setSpec("capacityGb", capacityGb);
                  setSpec("speedMt", speedMt);
                }
                if (category === "SSD") {
                  setSpec("interface", ssdInterface);
                  setSpec("capacityTb", capacityTb);
                  setSpec("readMb", readMb);
                  setSpec("writeMb", writeMb);
                }

                const resp = await api.post("/products", fd);
                nav(`/product/${resp.data.id}`);
              } catch (e: any) {
                const msg =
                  e?.response?.data?.message ?? "Не удалось опубликовать";
                setError(String(msg));
              } finally {
                setLoading(false);
              }
            }}
          >
            {loading ? "Публикуем…" : "Опубликовать"}
          </button>
          <button className="btn-secondary" onClick={() => nav("/catalog")} disabled={loading}>
            Отмена
          </button>
        </div>
      </section>
    </div>
  );
}

