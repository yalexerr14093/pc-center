import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useCartStore } from "../stores/cartStore";
import { useAuthStore } from "../stores/authStore";
import clsx from "clsx";
import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../lib/api";
import { playNotificationBeep, unlockNotificationAudio } from "../lib/messageNotify";
import { getSocket } from "../lib/socket";

const linkBase =
  "rounded-xl px-3 py-2 text-sm font-medium transition border border-transparent hover:border-slate-200 hover:bg-slate-50";

const adminPaths = ["/admin/analytics", "/admin/chats", "/admin/orders", "/admin/reports"];

const adminSubLink =
  "block rounded-lg px-3 py-2 text-sm text-slate-700 transition hover:bg-violet-50 hover:text-violet-950";

export function Layout() {
  const cartCount = useCartStore((s) => s.count());
  const { token, email, logout, userId, role } = useAuthStore();
  const isAdmin = role === "ADMIN";
  const nav = useNavigate();
  const location = useLocation();
  const [toast, setToast] = useState<{ title: string; text: string; convoId: string } | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  const adminMenuRef = useRef<HTMLDivElement>(null);

  const adminSectionActive = adminPaths.some((p) => location.pathname === p);

  useEffect(() => {
    setAdminMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!adminMenuOpen) return;
    const close = (e: MouseEvent) => {
      const el = adminMenuRef.current;
      if (el && !el.contains(e.target as Node)) setAdminMenuOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [adminMenuOpen]);

  const canNotify = useMemo(() => !!token && !!userId, [token, userId]);

  useEffect(() => {
    const onFirstGesture = () => {
      unlockNotificationAudio();
      window.removeEventListener("pointerdown", onFirstGesture);
    };
    window.addEventListener("pointerdown", onFirstGesture, { passive: true });
    return () => window.removeEventListener("pointerdown", onFirstGesture);
  }, []);

  useEffect(() => {
    if (!canNotify) return;

    let stopped = false;
    let lastToastAt = 0;

    async function refresh() {
      try {
        const r = await api.get<{
          items: Array<{
            id: string;
            product: { name: string };
            messages: Array<{ id: string; text: string; createdAt: string; senderId: string }>;
            lastReadMessageId: string | null;
          }>;
        }>("/conversations");

        let unread = 0;

        for (const c of r.data.items) {
          const last = c.messages?.[0];
          if (!last) continue;

          const isNew = !c.lastReadMessageId || last.id !== c.lastReadMessageId;
          const fromOther = last.senderId !== userId;

          if (isNew && fromOther) {
            unread++;

            // throttle toast so we don't spam
            const now = Date.now();
            if (!stopped && now - lastToastAt > 2000) {
              lastToastAt = now;
              setToast({
                title: `Новое сообщение: ${c.product.name}`,
                text: last.text.length > 80 ? `${last.text.slice(0, 80)}…` : last.text,
                convoId: c.id
              });
              void playNotificationBeep();
              window.setTimeout(() => setToast(null), 5000);
            }
          }
        }

        if (!stopped) setUnreadCount(unread);
      } catch {
        // ignore
      }
    }

    refresh();
    const s = getSocket();
    const onUpdated = () => void refresh();
    s.on("conversation:updated", onUpdated);
    s.on("message:new", onUpdated);

    return () => {
      stopped = true;
      s.off("conversation:updated", onUpdated);
      s.off("message:new", onUpdated);
    };
  }, [canNotify, userId]);

  return (
    <div className="min-h-dvh bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="container-app flex min-h-16 flex-wrap items-center justify-between gap-x-3 gap-y-2 py-2">
          <NavLink
            to="/"
            className="inline-flex shrink-0 items-center gap-2 font-semibold tracking-wide"
          >
            PC‑Center Marketplace
          </NavLink>

          <nav className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-2 sm:flex-nowrap">
            <NavLink
              to="/catalog"
              className={({ isActive }) => clsx(linkBase, isActive && "bg-slate-50 border-slate-200")}
            >
              Каталог
            </NavLink>
            <NavLink
              to="/sell"
              className={({ isActive }) => clsx(linkBase, isActive && "bg-slate-50 border-slate-200")}
            >
              Разместить
            </NavLink>
            {token ? (
              <NavLink
                to="/my"
                className={({ isActive }) => clsx(linkBase, isActive && "bg-slate-50 border-slate-200")}
              >
                Мои лоты
              </NavLink>
            ) : null}
            {token ? (
              <NavLink
                to="/messages"
                className={({ isActive }) => clsx(linkBase, isActive && "bg-slate-50 border-slate-200")}
              >
                Сообщения
                {unreadCount > 0 ? <span className="ml-2 badge">{unreadCount}</span> : null}
              </NavLink>
            ) : null}
            {token ? (
              <NavLink
                to="/orders"
                className={({ isActive }) => clsx(linkBase, isActive && "bg-slate-50 border-slate-200")}
              >
                Заказы
              </NavLink>
            ) : null}
            {token && isAdmin ? (
              <div className="relative" ref={adminMenuRef}>
                <button
                  type="button"
                  className={clsx(
                    linkBase,
                    "inline-flex items-center gap-1.5",
                    (adminMenuOpen || adminSectionActive) &&
                      "border-violet-200 bg-violet-50 text-violet-900"
                  )}
                  aria-expanded={adminMenuOpen}
                  aria-haspopup="menu"
                  onClick={() => setAdminMenuOpen((o) => !o)}
                >
                  Администратор
                  <svg
                    className={clsx("h-4 w-4 shrink-0 opacity-70 transition", adminMenuOpen && "rotate-180")}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden
                  >
                    <path d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.24 4.5a.75.75 0 01-1.08 0l-4.24-4.5a.75.75 0 01.02-1.06z" />
                  </svg>
                </button>
                {adminMenuOpen ? (
                  <div
                    className="absolute right-0 top-full z-50 mt-1 min-w-[11rem] rounded-xl border border-slate-200 bg-white py-1 shadow-lg ring-1 ring-black/5"
                    role="menu"
                  >
                    <NavLink
                      to="/admin/analytics"
                      role="menuitem"
                      className={({ isActive }) =>
                        clsx(adminSubLink, isActive && "bg-violet-100 font-medium text-violet-950")
                      }
                    >
                      Аналитика
                    </NavLink>
                    <NavLink
                      to="/admin/chats"
                      role="menuitem"
                      className={({ isActive }) =>
                        clsx(adminSubLink, isActive && "bg-violet-100 font-medium text-violet-950")
                      }
                    >
                      Все чаты
                    </NavLink>
                    <NavLink
                      to="/admin/orders"
                      role="menuitem"
                      className={({ isActive }) =>
                        clsx(adminSubLink, isActive && "bg-violet-100 font-medium text-violet-950")
                      }
                    >
                      Все заказы
                    </NavLink>
                    <NavLink
                      to="/admin/reports"
                      role="menuitem"
                      className={({ isActive }) =>
                        clsx(adminSubLink, isActive && "bg-violet-100 font-medium text-violet-950")
                      }
                    >
                      Жалобы
                    </NavLink>
                  </div>
                ) : null}
              </div>
            ) : null}
            <NavLink
              to="/cart"
              className={({ isActive }) => clsx(linkBase, isActive && "bg-slate-50 border-slate-200")}
            >
              Корзина
              <span className="ml-2 badge">{cartCount}</span>
            </NavLink>

            {token ? (
              <button
                className="btn-secondary"
                onClick={() => {
                  logout();
                  nav("/");
                }}
                title={email ?? undefined}
              >
                Выйти
              </button>
            ) : (
              <NavLink to="/auth" className="btn-primary">
                Войти
              </NavLink>
            )}
          </nav>
        </div>
      </header>

      <main className="container-app py-8">
        <Outlet />
      </main>

      {toast ? (
        <button
          type="button"
          className="fixed bottom-5 right-5 z-50 w-[min(420px,calc(100vw-40px))] rounded-2xl border border-slate-200 bg-white p-4 shadow-lg text-left"
          onClick={() => {
            unlockNotificationAudio();
            setToast(null);
            nav(`/messages?c=${toast.convoId}`);
          }}
        >
          <div className="text-sm font-semibold">{toast.title}</div>
          <div className="mt-1 text-sm text-slate-600">{toast.text}</div>
          <div className="mt-2 text-xs text-slate-500">Нажми, чтобы открыть диалог</div>
        </button>
      ) : null}

      <footer className="border-t border-slate-200 py-8">
        <div className="container-app text-sm text-slate-600">
          Маркетплейс комплектующих: каталог, объявления продавцов, корзина и оформление заказа.
        </div>
      </footer>
    </div>
  );
}

