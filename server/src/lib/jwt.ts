import jwt from "jsonwebtoken";
import type { UserRole } from "@prisma/client";
import { env } from "./env.js";

export type JwtPayload = {
  sub: string;
  email: string;
  /** Старые токены могли выдаваться без роли — тогда считаем USER */
  role?: UserRole;
};

export function signAccessToken(payload: JwtPayload) {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: "2h" });
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload & jwt.JwtPayload;
}

