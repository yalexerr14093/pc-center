import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, apiBaseURL } from "../lib/api";
import { useAuthStore } from "../stores/authStore";

export function AuthPage() {
  const nav = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  async function submit() {
    setMsg(null);
    const endpoint = mode === "login" ? "/auth/login" : "/auth/register";
    try {
      const payload = mode === "login" ? { email, password } : { email, password, name };
      const r = await api.post(endpoint, payload);
      setAuth(r.data.token, r.data.user.id, r.data.user.email, r.data.user.role ?? "USER");
      nav("/checkout");
    } catch (e: any) {
      const status = e?.response?.status;
      const path = e?.config?.url ?? endpoint;
      const tried = `${apiBaseURL}${path}`;
      if (status === 404) {
        setMsg(
          `Сервер не найден (404). Запрос: ${tried}. Запустите API (npm run dev), проверьте порт 4000. В client/.env укажите VITE_API_URL=http://localhost:4000 без /api в конце — или удалите client/.env (в dev работает прокси Vite).`
        );
      } else {
        setMsg(e?.response?.data?.message ?? `Ошибка авторизации${status ? ` (${status})` : ""}.`);
      }
    }
  }

  return (
    <div className="mx-auto grid w-full max-w-lg gap-6">
      <section className="card p-6">
        <div className="flex items-center justify-between">
          <h2 className="page-title">{mode === "login" ? "Вход" : "Регистрация"}</h2>
          <button
            className="btn-secondary"
            onClick={() => setMode((m) => (m === "login" ? "register" : "login"))}
          >
            {mode === "login" ? "Создать аккаунт" : "У меня есть аккаунт"}
          </button>
        </div>

        <div className="mt-6 grid gap-4">
          {mode === "register" && (
            <div>
              <label className="text-xs text-slate-600">Имя (необязательно)</label>
              <input className="input mt-1" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
          )}

          <div>
            <label className="text-xs text-slate-600">Email</label>
            <input className="input mt-1" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          <div>
            <label className="text-xs text-slate-600">Пароль</label>
            <input
              className="input mt-1"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button className="btn-primary" onClick={submit}>
            {mode === "login" ? "Войти" : "Зарегистрироваться"}
          </button>

          {msg && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-red-700">{msg}</div>}
        </div>

        <div className="mt-6 grid gap-2 text-sm text-slate-600">
          <div>
            Сессия: JWT в <code className="text-slate-900">localStorage</code>.
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-900">
            Учётная запись администратора: <code className="text-xs">npm run db:seed</code> из корня репозитория (или{" "}
            <code className="text-xs">npm run setup</code> при первом запуске). Логин:{" "}
            <span className="font-mono text-xs">admin@pc-center.local</span> /{" "}
            <span className="font-mono text-xs">adminadmin</span>
            <br />
            <span className="text-xs text-amber-800">
              Полный сброс каталога и заказов: <code>npm run db:seed:reset</code>
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}

