import { io, type Socket } from "socket.io-client";
import { apiOrigin } from "./api";
import { useAuthStore } from "../stores/authStore";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (socket) return socket;

  socket = io(apiOrigin, {
    transports: ["websocket"],
    autoConnect: false,
    auth: {
      token: useAuthStore.getState().token
    }
  });

  // keep auth token fresh
  useAuthStore.subscribe((s) => {
    const token = s.token;
    if (!socket) return;
    socket.auth = { token };
    if (token && !socket.connected) socket.connect();
    if (!token && socket.connected) socket.disconnect();
  });

  const token = useAuthStore.getState().token;
  if (token) socket.connect();

  return socket;
}

