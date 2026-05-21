import axios from "axios";
import { useAuthStore } from "../stores/authStore";

/** Убирает хвостовой /api и слэши — частая ошибка в client/.env */
export function normalizeApiOrigin(raw: string | undefined): string {
  if (!raw?.trim()) return "";
  let url = raw.trim().replace(/\/+$/, "");
  if (url.endsWith("/api")) url = url.slice(0, -4);
  return url;
}

const configured = normalizeApiOrigin(import.meta.env.VITE_API_URL);

/**
 * Пустая строка в dev = запросы на тот же origin (Vite проксирует /api → API).
 * В production или при явном VITE_API_URL — полный адрес API.
 */
export const apiOrigin =
  configured || (import.meta.env.DEV ? "" : "http://localhost:4000");

export const apiBaseURL = apiOrigin ? `${apiOrigin}/api` : "/api";

export const api = axios.create({
  baseURL: apiBaseURL
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.authorization = `Bearer ${token}`;
  return config;
});

export function resolveAssetUrl(url: string) {
  if (!url) return url;
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) return url;
  const origin =
    apiOrigin || (typeof window !== "undefined" ? window.location.origin : "http://localhost:4000");
  if (url.startsWith("/")) return `${origin}${url}`;
  return `${origin}/${url}`;
}

/** Origin для Socket.IO (в dev без .env — через прокси Vite). */
export function socketOrigin(): string {
  if (apiOrigin) return apiOrigin;
  if (typeof window !== "undefined") return window.location.origin;
  return "http://localhost:4000";
}
