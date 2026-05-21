/**
 * Первый запуск: копирует .env.example → .env, если файлов ещё нет.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

function copyIfMissing(exampleRel, envRel) {
  const example = path.join(root, exampleRel);
  const env = path.join(root, envRel);
  if (!fs.existsSync(example)) {
    console.warn(`[bootstrap] Нет файла ${exampleRel}`);
    return false;
  }
  if (fs.existsSync(env)) return false;
  fs.copyFileSync(example, env);
  return true;
}

const createdServer = copyIfMissing("server/.env.example", "server/.env");
const createdClient = copyIfMissing("client/.env.example", "client/.env");

if (createdServer) {
  console.log("[bootstrap] Создан server/.env");
  console.log("          → откройте его и укажите DATABASE_URL (PostgreSQL) и JWT_SECRET (≥16 символов).");
}
if (createdClient) {
  console.log("[bootstrap] Создан client/.env (для dev можно не менять — работает прокси Vite).");
}
if (!createdServer && !createdClient) {
  console.log("[bootstrap] Файлы .env уже на месте.");
}
