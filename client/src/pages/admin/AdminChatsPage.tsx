import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, resolveAssetUrl } from "../../lib/api";
import { formatRub } from "../../lib/format";

type Convo = {
  id: string;
  updatedAt: string;
  product: { id: string; name: string; imageUrl: string; priceRub: number };
  buyer: { id: string; email: string; name: string | null };
  seller: { id: string; email: string; name: string | null };
  messages: Array<{ id: string; text: string; createdAt: string; senderId: string }>;
};

type Msg = {
  id: string;
  text: string;
  createdAt: string;
  senderId: string;
  sender: { id: string; name: string | null; email: string };
};

export function AdminChatsPage() {
  const [convos, setConvos] = useState<Convo[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    api
      .get<{ items: Convo[] }>("/admin/conversations")
      .then((r) => {
        setConvos(r.data.items);
        if (r.data.items[0] && !selectedId) setSelectedId(r.data.items[0].id);
      })
      .catch((e: any) => setError(e?.response?.data?.message ?? "Ошибка загрузки"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    api
      .get<{ items: Msg[] }>(`/admin/conversations/${selectedId}/messages`)
      .then((r) => setMsgs(r.data.items))
      .catch(() => setMsgs([]));
  }, [selectedId]);

  const selected = convos.find((c) => c.id === selectedId) ?? null;

  if (error) {
    return (
      <div className="card border-red-200 bg-red-50 p-6 text-red-800">
        {error}
        <div className="mt-3">
          <Link className="underline" to="/">
            На главную
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-violet-950">Все чаты</h2>
          <p className="mt-1 text-sm text-slate-600">Просмотр переписок покупатель — продавец по объявлению.</p>
        </div>
        <Link className="btn-secondary" to="/admin/analytics">
          Аналитика
        </Link>
      </div>

      {loading ? <div className="text-slate-600">Загрузка…</div> : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <div className="card max-h-[70vh] overflow-y-auto p-2">
          {convos.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelectedId(c.id)}
              className={`mb-1 w-full rounded-xl border p-3 text-left text-sm transition ${
                c.id === selectedId
                  ? "border-violet-300 bg-violet-50"
                  : "border-transparent hover:border-slate-200 hover:bg-slate-50"
              }`}
            >
              <div className="font-medium text-slate-900">{c.product.name}</div>
              <div className="mt-1 text-xs text-slate-600">
                Покупатель: {c.buyer.email}
                <br />
                Продавец: {c.seller.email}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                {new Date(c.updatedAt).toLocaleString("ru-RU")}
              </div>
            </button>
          ))}
          {!convos.length && !loading ? (
            <div className="p-4 text-sm text-slate-600">Чатов пока нет.</div>
          ) : null}
        </div>

        <div className="card flex max-h-[70vh] flex-col p-4">
          {selected ? (
            <>
              <div className="border-b border-slate-200 pb-3">
                <div className="flex gap-3">
                  <img
                    src={resolveAssetUrl(selected.product.imageUrl)}
                    alt=""
                    className="h-16 w-16 shrink-0 rounded-lg border border-slate-200 object-cover"
                  />
                  <div className="min-w-0">
                    <div className="font-semibold">{selected.product.name}</div>
                    <div className="text-sm text-slate-600">{formatRub(selected.product.priceRub)}</div>
                  </div>
                </div>
              </div>
              <div className="mt-3 flex-1 space-y-2 overflow-y-auto pr-1">
                {msgs.map((m) => (
                  <div key={m.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-sm">
                    <div className="text-xs text-slate-500">
                      {m.sender.email} · {new Date(m.createdAt).toLocaleString("ru-RU")}
                    </div>
                    <div className="mt-1 whitespace-pre-wrap text-slate-900">{m.text}</div>
                  </div>
                ))}
                {!msgs.length ? <div className="text-sm text-slate-600">Нет сообщений.</div> : null}
              </div>
            </>
          ) : (
            <div className="text-slate-600">Выберите чат слева.</div>
          )}
        </div>
      </div>
    </div>
  );
}
