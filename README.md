# PC-Center — SPA интернет‑магазина компьютерных комплектующих

## Назначение

Это **демонстрационный (учебно‑портфельный) проект**: сценарии, экраны и формулировки сознательно сделаны **как у настоящего коммерческого маркетплейса**, чтобы показать полноценный продуктовый UX и типовую архитектуру. При этом проект **не является реальным бизнес‑решением**: нет настоящей торговли, юридических обязательств, доставки и списания денег у клиентов; платёжный шаг при необходимости опирается на **Stripe в тестовом режиме** или имитацию потока без боевых реквизитов.

Стек:

- **Frontend**: React (Vite) + Tailwind CSS + React Router
- **Backend API**: Node.js + Express
- **DB**: PostgreSQL + Prisma ORM
- **Auth**: JWT (access token)
- **Платежи**: Stripe PaymentIntent (только test mode / без реальных списаний)
- **Images**: ссылки на Cloudinary (публичные URL для примера)

## Быстрый старт

### 1) Требования

- Node.js 18+ (рекомендуется 20+)
- PostgreSQL 14+ (локально)

### 2) Создание базы данных PostgreSQL (локально)

Вариант A (через `psql`):

```sql
-- зайдите в psql под суперпользователем (например, postgres)
CREATE DATABASE pc_center;

-- опционально: отдельный пользователь
CREATE USER pc_center_user WITH PASSWORD 'pc_center_pass';
GRANT ALL PRIVILEGES ON DATABASE pc_center TO pc_center_user;
```

Затем задайте строку подключения в `server/.env`:

```bash
DATABASE_URL="postgresql://pc_center_user:pc_center_pass@localhost:5432/pc_center?schema=public"
JWT_SECRET="change-me-change-me"
STRIPE_SECRET_KEY="sk_test_..."
CLIENT_ORIGIN="http://localhost:5173"
```

Вариант B (если вы используете встроенного пользователя `postgres`):

```bash
DATABASE_URL="postgresql://postgres:ВАШ_ПАРОЛЬ@localhost:5432/pc_center?schema=public"
```

### 3) Установка зависимостей

```bash
npm install
```

### 4) Миграции и заполнение товарами

```bash
npm --workspace server run db:migrate
npm --workspace server run db:seed
```

### 5) Запуск (клиент + сервер)

```bash
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:4000`

## Основные возможности (по ТЗ)

- **Главная**: баннер/промо + CTA в каталог
- **Каталог**: карточки товаров (CPU, GPU, Motherboard, RAM, SSD)
- **Фильтры**: категория + диапазон цены + поиск по названию
- **Детали товара**: «В корзину»
- **Корзина**: добавление/удаление, изменение количества, сумма
- **Оформление**: имя, телефон, адрес; создание заказа в БД
- **Оплата (тестовый сценарий)**: Stripe PaymentIntent в test mode (фронт получает `client_secret`)
- **JWT‑авторизация**: регистрация/логин; создание заказа доступно только авторизованным

## Переменные окружения

Файл `server/.env`:

- **DATABASE_URL**: строка подключения PostgreSQL
- **JWT_SECRET**: секрет для подписи JWT
- **STRIPE_SECRET_KEY**: Stripe secret key (test)
- **CLIENT_ORIGIN**: origin фронтенда для CORS

Файл `client/.env` (не обязателен, есть дефолт):

- **VITE_API_URL**: URL API (по умолчанию `http://localhost:4000`)

## Тестовые карты Stripe

Используйте тестовые данные Stripe:

- Номер карты: `4242 4242 4242 4242`
- Любая будущая дата, любой CVC

