# PC-Center — SPA интернет‑магазина компьютерных комплектующих

## Назначение

Это **демонстрационный (учебно‑портфельный) проект**: сценарии, экраны и формулировки сознательно сделаны **как у настоящего коммерческого маркетплейса**, чтобы показать полноценный продуктовый UX и типовую архитектуру. При этом проект **не является реальным бизнес‑решением**: нет настоящей торговли, юридических обязательств, доставки и списания денег у клиентов; платёжный шаг при необходимости опирается на **Stripe в тестовом режиме** или имитацию потока без боевых реквизитов.

Стек: React (Vite) + Express + PostgreSQL + Prisma + JWT.

---

## Перенос на другой ПК (коротко)

**Нужно:** Node.js 18+, PostgreSQL 14+.

### 1. База PostgreSQL

```sql
CREATE DATABASE pc_center;
```

### 2. Проект

```bash
git clone <URL-репозитория>
cd pc-center
npm install
```

`npm install` автоматически запускает **`prisma generate`**.

### 3. Первичная настройка

```bash
npm run bootstrap
```

Создаст `server/.env` и `client/.env` из примеров, если их ещё нет.

**Откройте `server/.env`** и замените `DATABASE_URL` на свою строку подключения (логин/пароль PostgreSQL на этом ПК).

### 4. Схема БД и стартовые данные

```bash
npm run setup
```

(или одной командой после правки `.env`: `npm run first-run` — то же, что `bootstrap` + `setup`).

### 5. Запуск

```bash
npm run dev
```

| Сервис | URL |
|--------|-----|
| Сайт | http://localhost:5173 |
| API | http://localhost:4000 |
| Проверка API | http://localhost:4000/health |

**Админ после seed:** `admin@pc-center.local` / `adminadmin`

---

## Почему вход даёт 404

Чаще всего API не запущен или неверный `VITE_API_URL`.

- В **dev** можно **не создавать** `client/.env` — Vite проксирует `/api` на порт **4000**.
- Если `client/.env` есть, пишите **`VITE_API_URL=http://localhost:4000`** (без `/api` в конце).
- После смены `.env` перезапустите `npm run dev`.

Проверка в PowerShell:

```powershell
curl http://localhost:4000/health
```

---

## Ошибка «Prisma Client did not initialize yet»

```bash
npm run db:generate
```

Перед этим **остановите** запущенный API. Команда выполняется из **корня** репозитория.

---

## Команды

| Команда | Назначение |
|---------|------------|
| `npm run bootstrap` | Создать `.env` из примеров |
| `npm run setup` | Prisma + схема в БД + seed |
| `npm run first-run` | bootstrap + setup |
| `npm run dev` | API + фронт |
| `npm run db:seed:reset` | Полный сброс каталога и заказов |

---

## Переменные окружения

**`server/.env`:** `DATABASE_URL`, `JWT_SECRET` (≥16 символов), опционально `PORT`, `CLIENT_ORIGIN`, `STRIPE_SECRET_KEY`.

**`client/.env`:** опционально `VITE_API_URL` (см. выше).

---

## Тестовые карты Stripe

- `4242 4242 4242 4242`, любая будущая дата и CVC.
