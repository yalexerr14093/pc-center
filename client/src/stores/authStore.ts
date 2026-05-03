import { create } from "zustand";

export type UserRole = "USER" | "ADMIN";

type AuthState = {
  token: string | null;
  email: string | null;
  userId: string | null;
  role: UserRole | null;
  setAuth: (token: string, userId: string, email: string, role?: UserRole) => void;
  logout: () => void;
};

const LS_TOKEN = "pc_center_token";
const LS_USER_ID = "pc_center_user_id";
const LS_EMAIL = "pc_center_email";
const LS_ROLE = "pc_center_role";

function readRole(): UserRole | null {
  const r = localStorage.getItem(LS_ROLE);
  if (r === "ADMIN" || r === "USER") return r;
  return null;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem(LS_TOKEN),
  userId: localStorage.getItem(LS_USER_ID),
  email: localStorage.getItem(LS_EMAIL),
  role: readRole(),
  setAuth: (token, userId, email, role = "USER") => {
    localStorage.setItem(LS_TOKEN, token);
    localStorage.setItem(LS_USER_ID, userId);
    localStorage.setItem(LS_EMAIL, email);
    localStorage.setItem(LS_ROLE, role);
    set({ token, userId, email, role });
  },
  logout: () => {
    localStorage.removeItem(LS_TOKEN);
    localStorage.removeItem(LS_USER_ID);
    localStorage.removeItem(LS_EMAIL);
    localStorage.removeItem(LS_ROLE);
    set({ token: null, userId: null, email: null, role: null });
  }
}));
