import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";

/** Дочерние маршруты доступны только при role === ADMIN */
export function RequireAdmin() {
  const token = useAuthStore((s) => s.token);
  const role = useAuthStore((s) => s.role);
  if (!token) return <Navigate to="/auth" replace />;
  if (role !== "ADMIN") return <Navigate to="/" replace />;
  return <Outlet />;
}
