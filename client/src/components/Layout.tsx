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

const mobileNavItem = (active: boolean) =>
  clsx(
    "flex w-full items-center justify-between gap-2 rounded-xl border px-4 py-3.5 text-[0.9375rem] font-medium leading-snug transition sm:py-3",
    active
      ? "border-emerald-200/80 bg-emerald-50/70 text-emerald-950"
      : "border-transparent text-slate-800 hover:border-slate-200 hover:bg-slate-50"
  );

const adminPaths = ["/admin/analytics", "/admin/chats", "/admin/orders", "/admin/reports"];

const adminSubLink =
  "block rounded-lg px-3 py-2 text-sm text-slate-700 transition hover:bg-violet-50 hover:text-violet-950";

const adminMobileLink = (active: boolean) =>
  clsx(
    "block rounded-xl border px-4 py-3 text-sm font-medium transition",
    active ? "border-violet-200 bg-violet-50 text-violet-950" : "border-transparent text-slate-700 hover:bg-violet-50/60"
  );

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
  const [drawerOpen, setDrawerOpen] = useState(false);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  const adminSectionActive = adminPaths.some((p) => location.pathname === p);

  const closeDrawer = () => setDrawerOpen(false);

  useEffect(() => {
    setAdminMenuOpen(false);
    setDrawerOpen(false);
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

  useEffect(() => {
    if (!drawerOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawerOpen(false);
    };
    window.addEventListener("keydown", onKey);
    closeBtnRef.current?.focus();
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [drawerOpen]);

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
    <div className="min-h-dvh min-w-0 bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur-md supports-[backdrop-filter]:bg-white/75">
        <div className="container-app flex min-h-[3.25rem] items-center justify-between gap-2 py-2 sm:min-h-16 sm:gap-3 sm:py-2.5">
          <NavLink
            to="/"
            className="min-w-0 shrink truncate text-sm font-semibold tracking-wide text-slate-900 sm:text-base"
          >
            PC‑Center Marketplace
          </NavLink>

          <nav
            className="hidden min-w-0 flex-1 flex-wrap items-center justify-end gap-1.5 lg:flex lg:flex-nowrap xl:gap-2"
            aria-label="Основная навигация"
          >
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
                    (adminMenuOpen || adminSectionActive) && "border-violet-200 bg-violet-50 text-violet-900"
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
                type="button"
                className="btn-secondary touch-manipulation"
                onClick={() => {
                  logout();
                  nav("/");
                }}
                title={email ?? undefined}
              >
                Выйти
              </button>
            ) : (
              <NavLink to="/auth" className="btn-primary touch-manipulation">
                Войти
              </NavLink>
            )}
          </nav>

          <button
            type="button"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-800 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50/60 hover:text-emerald-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 lg:hidden touch-manipulation"
            aria-label={drawerOpen ? "Закрыть меню" : "Открыть меню"}
            aria-expanded={drawerOpen}
            aria-controls="site-mobile-nav"
            onClick={() => setDrawerOpen((o) => !o)}
          >
            <span className="sr-only">Меню</span>
            {drawerOpen ? (
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
              </svg>
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* Мобильное меню: оверлей + панель */}
      <div
        className={clsx(
          "fixed inset-0 z-[45] transition-[opacity,visibility] duration-200 ease-out lg:hidden",
          drawerOpen ? "visible opacity-100" : "invisible pointer-events-none opacity-0"
        )}
        aria-hidden={!drawerOpen}
      >
        <button
          type="button"
          className="absolute inset-0 bg-slate-900/45 backdrop-blur-[2px]"
          aria-label="Закрыть меню"
          onClick={closeDrawer}
        />
        <aside
          id="site-mobile-nav"
          role="dialog"
          aria-modal="true"
          aria-label="Навигация по сайту"
          className={clsx(
            "absolute inset-y-0 right-0 flex w-[min(20.5rem,calc(100vw-2.5rem))] max-w-full flex-col border-l border-slate-200/90 bg-white shadow-2xl transition-transform duration-200 ease-out",
            drawerOpen ? "translate-x-0" : "translate-x-full"
          )}
        >
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-3.5">
            <span className="text-sm font-semibold text-slate-900">Разделы</span>
            <button
              ref={closeBtnRef}
              type="button"
              className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 touch-manipulation"
              aria-label="Закрыть"
              onClick={closeDrawer}
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto overscroll-contain p-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <NavLink to="/catalog" className={({ isActive }) => mobileNavItem(isActive)} onClick={closeDrawer}>
              Каталог
            </NavLink>
            <NavLink to="/sell" className={({ isActive }) => mobileNavItem(isActive)} onClick={closeDrawer}>
              Разместить
            </NavLink>
            {token ? (
              <NavLink to="/my" className={({ isActive }) => mobileNavItem(isActive)} onClick={closeDrawer}>
                Мои лоты
              </NavLink>
            ) : null}
            {token ? (
              <NavLink to="/messages" className={({ isActive }) => mobileNavItem(isActive)} onClick={closeDrawer}>
                <span className="min-w-0">Сообщения</span>
                {unreadCount > 0 ? <span className="badge shrink-0">{unreadCount}</span> : null}
              </NavLink>
            ) : null}
            {token ? (
              <NavLink to="/orders" className={({ isActive }) => mobileNavItem(isActive)} onClick={closeDrawer}>
                Заказы
              </NavLink>
            ) : null}
            {token && isAdmin ? (
              <div className="mt-1 rounded-xl border border-violet-100 bg-violet-50/40 p-2">
                <div className="px-2 pb-2 pt-1 text-xs font-semibold uppercase tracking-wide text-violet-800/90">
                  Администратор
                </div>
                <div className="flex flex-col gap-1">
                  <NavLink
                    to="/admin/analytics"
                    className={({ isActive }) => adminMobileLink(isActive)}
                    onClick={closeDrawer}
                  >
                    Аналитика
                  </NavLink>
                  <NavLink to="/admin/chats" className={({ isActive }) => adminMobileLink(isActive)} onClick={closeDrawer}>
                    Все чаты
                  </NavLink>
                  <NavLink to="/admin/orders" className={({ isActive }) => adminMobileLink(isActive)} onClick={closeDrawer}>
                    Все заказы
                  </NavLink>
                  <NavLink to="/admin/reports" className={({ isActive }) => adminMobileLink(isActive)} onClick={closeDrawer}>
                    Жалобы
                  </NavLink>
                </div>
              </div>
            ) : null}
            <NavLink to="/cart" className={({ isActive }) => mobileNavItem(isActive)} onClick={closeDrawer}>
              <span>Корзина</span>
              <span className="badge shrink-0">{cartCount}</span>
            </NavLink>

            <div className="mt-auto border-t border-slate-100 pt-3">
              {token ? (
                <>
                  {email ? (
                    <p className="mb-2 truncate px-1 text-center text-xs leading-snug text-slate-500" title={email}>
                      {email}
                    </p>
                  ) : null}
                  <button
                    type="button"
                    className="btn-secondary w-full touch-manipulation"
                    onClick={() => {
                      logout();
                      nav("/");
                      closeDrawer();
                    }}
                  >
                    Выйти
                  </button>
                </>
              ) : (
                <NavLink to="/auth" className="btn-primary block w-full text-center touch-manipulation" onClick={closeDrawer}>
                  Войти
                </NavLink>
              )}
            </div>
          </nav>
        </aside>
      </div>

      <main className="container-app min-w-0 py-6 sm:py-8">
        <Outlet />
      </main>

      {toast ? (
        <button
          type="button"
          className="fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-[max(1.25rem,env(safe-area-inset-right))] z-50 w-[min(420px,calc(100vw-1.5rem))] max-w-[calc(100vw-1.5rem)] rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-lg touch-manipulation"
          onClick={() => {
            unlockNotificationAudio();
            setToast(null);
            nav(`/messages?c=${toast.convoId}`);
          }}
        >
          <div className="text-sm font-semibold leading-snug">{toast.title}</div>
          <div className="mt-1 text-sm leading-snug text-slate-600">{toast.text}</div>
          <div className="mt-2 text-xs text-slate-500">Нажми, чтобы открыть диалог</div>
        </button>
      ) : null}

      <footer className="border-t border-slate-200 py-6 sm:py-8">
        <div className="container-app text-sm leading-relaxed text-slate-600 sm:text-[0.9375rem]">
          Маркетплейс комплектующих: каталог, объявления продавцов, корзина и оформление заказа.
        </div>
      </footer>
    </div>
  );
}
