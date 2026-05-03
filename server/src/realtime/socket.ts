import type http from "node:http";
import { Server } from "socket.io";
import { verifyAccessToken } from "../lib/jwt.js";

export type AuthedSocketUser = { id: string; email: string; role: "USER" | "ADMIN" };

let io: Server | null = null;
const onlineCounts = new Map<string, number>();

export function initSocket(server: http.Server) {
  if (io) return io;

  io = new Server(server, {
    cors: {
      origin: true,
      credentials: true
    }
  });

  io.use((socket, next) => {
    try {
      const token =
        (socket.handshake.auth as any)?.token ??
        (socket.handshake.headers.authorization?.split(" ")[1] ?? "");
      if (!token) return next(new Error("Unauthorized"));
      const payload = verifyAccessToken(token);
      const role = payload.role === "ADMIN" ? "ADMIN" : "USER";
      (socket.data as any).user = { id: payload.sub, email: payload.email, role } satisfies AuthedSocketUser;
      return next();
    } catch {
      return next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const user = (socket.data as any).user as AuthedSocketUser | undefined;
    if (!user) return;

    socket.join(`user:${user.id}`);

    onlineCounts.set(user.id, (onlineCounts.get(user.id) ?? 0) + 1);
    io?.emit("presence:update", { userId: user.id, online: true });

    socket.on("disconnect", () => {
      const next = (onlineCounts.get(user.id) ?? 1) - 1;
      if (next <= 0) {
        onlineCounts.delete(user.id);
        io?.emit("presence:update", { userId: user.id, online: false });
      } else {
        onlineCounts.set(user.id, next);
      }
    });

    socket.on("typing", (payload: { conversationId: string; isTyping: boolean }) => {
      if (!payload?.conversationId) return;
      socket.to(`convo:${payload.conversationId}`).emit("typing", {
        conversationId: payload.conversationId,
        userId: user.id,
        isTyping: !!payload.isTyping
      });
    });

    socket.on("join_conversation", (payload: { conversationId: string }) => {
      if (!payload?.conversationId) return;
      socket.join(`convo:${payload.conversationId}`);
    });

    socket.on("leave_conversation", (payload: { conversationId: string }) => {
      if (!payload?.conversationId) return;
      socket.leave(`convo:${payload.conversationId}`);
    });
  });

  return io;
}

export function getIo() {
  if (!io) throw new Error("Socket.IO not initialized");
  return io;
}

export function isUserOnline(userId: string) {
  return (onlineCounts.get(userId) ?? 0) > 0;
}

