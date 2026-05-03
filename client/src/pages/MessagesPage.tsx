import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api, resolveAssetUrl } from "../lib/api";
import { getSocket } from "../lib/socket";
import { useAuthStore } from "../stores/authStore";

type ConversationListItem = {
  id: string;
  product: { id: string; name: string; imageUrl: string; priceRub: number };
  buyer: { id: string; name: string | null };
  seller: { id: string; name: string | null };
  messages: Array<{ id: string; text: string; createdAt: string; senderId: string }>;
  updatedAt: string;
  lastReadMessageId: string | null;
};

type Message = {
  id: string;
  text: string;
  createdAt: string;
  senderId: string;
  sender: { id: string; name: string | null };
};

export function MessagesPage() {
  const token = useAuthStore((s) => s.token);
  const userId = useAuthStore((s) => s.userId);
  const myEmail = useAuthStore((s) => s.email);
  const [params, setParams] = useSearchParams();
  const selectedId = params.get("c") ?? "";

  const [convos, setConvos] = useState<ConversationListItem[]>([]);
  const [msgs, setMsgs] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [typingUserIds, setTypingUserIds] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected = useMemo(() => convos.find((c) => c.id === selectedId) ?? null, [convos, selectedId]);

  async function loadConvos() {
    const r = await api.get<{ items: ConversationListItem[] }>("/conversations");
    setConvos(r.data.items);
    if (!selectedId && r.data.items[0]) setParams({ c: r.data.items[0].id });
  }

  async function loadMessages(conversationId: string) {
    const r = await api.get<{ items: Message[]; lastReadMessageId: string | null }>(`/conversations/${conversationId}/messages`);
    setMsgs(r.data.items);
    const last = r.data.items[r.data.items.length - 1];
    if (last) await api.post(`/conversations/${conversationId}/read`, { messageId: last.id });
  }

  useEffect(() => {
    if (!token) return;
    setError(null);
    setLoading(true);
    loadConvos()
      .catch((e: any) => setError(e?.response?.data?.message ?? "Не удалось загрузить диалоги"))
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    if (!token) return;
    if (!selectedId) return;
    loadMessages(selectedId).catch(() => {});
  }, [token, selectedId]);

  useEffect(() => {
    if (!token) return;
    const s = getSocket();

    const onConversationUpdated = () => {
      loadConvos().catch(() => {});
    };
    const onNewMessage = (payload: { conversationId: string; message: Message }) => {
      if (!payload?.conversationId) return;
      if (payload.conversationId === selectedId) {
        setMsgs((prev) => (prev.some((m) => m.id === payload.message.id) ? prev : [...prev, payload.message]));
        void api.post(`/conversations/${payload.conversationId}/read`, { messageId: payload.message.id });
      }
      loadConvos().catch(() => {});
    };
    const onTyping = (payload: { conversationId: string; userId: string; isTyping: boolean }) => {
      if (!payload?.conversationId) return;
      if (payload.conversationId !== selectedId) return;
      if (!userId || payload.userId === userId) return;
      setTypingUserIds((prev) => ({ ...prev, [payload.userId]: !!payload.isTyping }));
      if (payload.isTyping) {
        window.setTimeout(() => {
          setTypingUserIds((prev) => ({ ...prev, [payload.userId]: false }));
        }, 2500);
      }
    };

    s.on("conversation:updated", onConversationUpdated);
    s.on("message:new", onNewMessage);
    s.on("typing", onTyping);
    if (selectedId) s.emit("join_conversation", { conversationId: selectedId });

    return () => {
      if (selectedId) s.emit("leave_conversation", { conversationId: selectedId });
      s.off("conversation:updated", onConversationUpdated);
      s.off("message:new", onNewMessage);
      s.off("typing", onTyping);
    };
  }, [token, selectedId]);

  if (!token) {
    return (
      <div className="card p-6">
        <div className="text-xl font-semibold">Сообщения</div>
        <div className="mt-2 text-slate-600">Нужно войти, чтобы писать продавцам.</div>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold">Сообщения</h2>
          <div className="mt-1 text-sm text-slate-600">{myEmail ?? ""}</div>
        </div>
      </div>

      {error ? <div className="card p-4 border-red-200 bg-red-50 text-red-700">{error}</div> : null}
      {loading ? (
        <div className="text-slate-600">Загрузка…</div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
          <aside className="card p-2">
            {convos.length ? (
              <div className="grid">
                {convos.map((c) => {
                  const last = c.messages?.[0];
                  return (
                    <button
                      key={c.id}
                      className={`flex w-full gap-3 rounded-xl p-3 text-left hover:bg-slate-50 ${
                        c.id === selectedId ? "bg-slate-50" : ""
                      }`}
                      onClick={() => setParams({ c: c.id })}
                      type="button"
                    >
                      <div className="h-14 w-14 overflow-hidden rounded-xl bg-slate-100 border border-slate-200">
                        <img className="h-full w-full object-cover" src={resolveAssetUrl(c.product.imageUrl)} alt="" />
                      </div>
                      <div className="min-w-0">
                        <div className="truncate font-semibold">{c.product.name}</div>
                        <div className="mt-1 truncate text-xs text-slate-600">{last ? last.text : "Нет сообщений"}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 text-slate-600">Диалогов пока нет.</div>
            )}
          </aside>

          <section className="card p-4">
            {selected ? (
              <div className="grid gap-4">
                <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-3">
                  <div className="min-w-0">
                    <div className="truncate font-semibold">{selected.product.name}</div>
                    <div className="mt-1 text-xs text-slate-600">Диалог по товару</div>
                  </div>
                </div>

                <div className="max-h-[55vh] overflow-auto rounded-xl border border-slate-200 bg-white p-3">
                  <div className="grid gap-2">
                    {msgs.map((m) => {
                      const mine = !!userId && m.senderId === userId;
                      return (
                        <div
                          key={m.id}
                          className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                            mine ? "ml-auto bg-emerald-600 text-white" : "bg-slate-100 text-slate-900"
                          }`}
                          title={new Date(m.createdAt).toLocaleString()}
                        >
                          {m.text}
                        </div>
                      );
                    })}
                  </div>
                </div>
                {Object.values(typingUserIds).some(Boolean) ? (
                  <div className="text-xs text-slate-500">Печатает…</div>
                ) : null}

                <div className="flex gap-2">
                  <input
                    className="input"
                    value={text}
                    placeholder="Написать сообщение…"
                    onChange={(e) => {
                      setText(e.target.value);
                      const s = getSocket();
                      s.emit("typing", { conversationId: selected.id, isTyping: true });
                      window.setTimeout(() => {
                        s.emit("typing", { conversationId: selected.id, isTyping: false });
                      }, 900);
                    }}
                    onKeyDown={async (e) => {
                      if (e.key !== "Enter") return;
                      if (!text.trim()) return;
                      const payload = text.trim();
                      setText("");
                      await api.post(`/conversations/${selected.id}/messages`, { text: payload });
                      // message will arrive through socket; still keep list fresh
                      loadConvos().catch(() => {});
                    }}
                  />
                  <button
                    className="btn-primary"
                    onClick={async () => {
                      if (!text.trim()) return;
                      const payload = text.trim();
                      setText("");
                      await api.post(`/conversations/${selected.id}/messages`, { text: payload });
                      loadConvos().catch(() => {});
                    }}
                  >
                    Отправить
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-slate-600">Выбери диалог слева.</div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

