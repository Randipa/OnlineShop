# ShopVerse — E-Commerce Platform

**ShopVerse** යනු online shop එකක් run කරන්න පුළුවන් full-stack e-commerce platform එකක්. Customer ට products browse කරලා cart එකට දාලා, login වෙලා, order place කරලා Stripe payment එකෙන් pay කරන්න පුළුවන්. Admin ට inventory හා orders manage කරන්න dashboard එකක් තියෙනවා.

---

## Project Idea (මුළු Project එකේ Concept)

### Problem
Online shop එකක් build කරද්දී usually frontend, backend, database, payments, auth — මේ හැම දෙයක්ම වෙන වෙනම handle කරන්න වෙනවා. ShopVerse එකේ idea එක ඒ සියල්ල **එක project එකක්** යටතේ clean architecture එකකින් organize කරලා, real-world e-commerce flow එක end-to-end demonstrate කරන්න.

### Solution
Monorepo එකක් විදිහට:

| Part | Role |
|------|------|
| **Frontend** (Next.js) | Customer-facing storefront + admin UI |
| **Backend** (NestJS) | REST API — auth, products, orders, payments |
| **Database** (PostgreSQL + Prisma) | Users, products, categories, orders store කරනවා |
| **Stripe** | Secure payment processing |
| **Docker** | Local development & deployment simplify කරනවා |
| **GitHub Actions** | Push/PR වෙනකොට automatic build test |

### User Flow (Customer)

```
Home → Browse Products → Product Detail → Add to Cart
  → Login/Register → Checkout (shipping address)
  → Order Created → Stripe Payment → Order Confirmed
```

1. **Browse** — Featured products home page එකේ, full catalog `/products` page එකේ
2. **Cart** — Items browser localStorage එකේ save වෙනවා (login නැතුවත් cart තියෙනවා)
3. **Auth** — Checkout කරන්න login වෙන්න ඕන; JWT token localStorage එකේ store වෙනවා
4. **Order** — Order create වෙනකොට stock automatically reduce වෙනවා (real-time inventory)
5. **Payment** — Stripe Payment Intent create වෙනවා; webhook එකෙන් order status `PAID` වෙනවා

### Admin Flow

```
Admin Login → Dashboard
  → View all products & stock levels
  → Low stock alerts (< 20 items)
  → View all customer orders
  → Update order status (PENDING → PAID → SHIPPED → DELIVERED)
```

Admin routes backend එකේ `AdminGuard` + frontend එකේ role check (`user.role === "ADMIN"`) දෙකෙන් protect කරලා තියෙනවා.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js 15)                     │
│  Pages: Home, Products, Cart, Checkout, Login, Admin        │
│  Context: AuthContext (JWT), CartContext (localStorage)     │
└──────────────────────────┬──────────────────────────────────┘
                           │ REST API (fetch + Bearer token)
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend (NestJS)                          │
│  Modules: Auth | Products | Categories | Orders | Payments  │
└──────────────────────────┬──────────────────────────────────┘
                           │ Prisma ORM
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                 PostgreSQL Database                          │
│  Models: User, Category, Product, Order, OrderItem          │
└─────────────────────────────────────────────────────────────┘

        Payments Module ──► Stripe API (Payment Intents + Webhooks)
```

### Database Models

| Model | Purpose |
|-------|---------|
| `User` | Customer & admin accounts (`USER` / `ADMIN` roles) |
| `Category` | Product grouping (Electronics, Clothing, etc.) |
| `Product` | Name, price, stock, image, featured flag |
| `Order` | User order with status, total, shipping address |
| `OrderItem` | Line items (product, quantity, price at purchase time) |

Order status flow: `PENDING` → `PAID` → `SHIPPED` → `DELIVERED` (or `CANCELLED`)

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15, TypeScript, Tailwind CSS |
| Backend | NestJS, Prisma, PostgreSQL |
| Payments | Stripe |
| DevOps | Docker, GitHub Actions CI/CD |

---

## Features

- Product catalog with categories & search
- Shopping cart (persistent localStorage)
- User authentication (JWT + bcrypt)
- Order management with real-time inventory (transaction-based stock decrement)
- Stripe payment intents + webhooks
- Admin dashboard (inventory + orders + low-stock alerts)
- Dockerized PostgreSQL
- CI pipeline (backend build + frontend build on push/PR)

---

## Project Structure

```
ecommerce-platform/
├── frontend/
│   ├── src/
│   │   ├── app/              # Next.js App Router pages
│   │   │   ├── page.tsx           # Home (featured products)
│   │   │   ├── products/          # Catalog + product detail
│   │   │   ├── cart/              # Shopping cart
│   │   │   ├── checkout/          # Order placement
│   │   │   ├── login/             # Auth
│   │   │   ├── orders/[id]/       # Order confirmation
│   │   │   └── admin/             # Admin dashboard
│   │   ├── components/       # Navbar, ProductCard
│   │   ├── context/          # AuthContext, CartContext
│   │   ├── lib/api.ts        # Backend API client
│   │   └── types/            # TypeScript interfaces
│   └── package.json
│
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma     # Database schema
│   │   └── seed.ts           # Demo data (products, users)
│   ├── src/
│   │   ├── auth/             # Register, login, JWT strategy, guards
│   │   ├── products/         # CRUD + inventory endpoints
│   │   ├── categories/       # Category listing
│   │   ├── orders/           # Create order, list, status update
│   │   ├── payments/         # Stripe intents + webhooks
│   │   └── prisma/           # Prisma service module
│   └── package.json
│
├── docker-compose.yml        # PostgreSQL + backend containers
├── .github/workflows/ci.yml  # CI/CD pipeline
└── README.md
```

---

## GitHub Manual Push Guide (Podda Podda Push කරන්න)

Git repo initialize කරලා GitHub එකට code push කරන්න ඕන නම්, මේ order එක follow කරන්න. එක commit එකකට logical chunk එකක් දාන්න — reviewers ට හොඳට understand වෙනවා.

### Step 0 — Repo Setup

```bash
cd ecommerce-platform
git init
git add .gitignore README.md
git commit -m "Initial commit: project overview and gitignore"
git remote add origin https://github.com/YOUR_USERNAME/ecommerce-platform.git
git branch -M main
git push -u origin main
```

### Step 1 — Database & Backend Foundation

```bash
git add backend/prisma/ backend/src/prisma/ backend/src/main.ts backend/src/app.module.ts
git add backend/package.json backend/tsconfig.json backend/nest-cli.json backend/.env.example
git commit -m "Add backend foundation with Prisma schema and NestJS setup"
git push
```

**Idea:** Database models (User, Product, Order...) define කරලා NestJS app skeleton එක setup කරනවා.

### Step 2 — Auth Module

```bash
git add backend/src/auth/
git commit -m "Add JWT authentication with register and login"
git push
```

**Idea:** Users register/login වෙනවා; password bcrypt hash; JWT token return වෙනවා.

### Step 3 — Products & Categories

```bash
git add backend/src/products/ backend/src/categories/ backend/prisma/seed.ts
git commit -m "Add products and categories API with seed data"
git push
```

**Idea:** Product catalog API — list, search, filter by category/featured; admin inventory endpoint.

### Step 4 — Orders & Payments

```bash
git add backend/src/orders/ backend/src/payments/
git commit -m "Add order management and Stripe payment integration"
git push
```

**Idea:** Order create වෙනකොට stock reduce; Stripe payment intent + webhook handle.

### Step 5 — Backend Docker

```bash
git add backend/Dockerfile docker-compose.yml
git commit -m "Add Docker setup for PostgreSQL and backend"
git push
```

### Step 6 — Frontend Foundation

```bash
git add frontend/package.json frontend/tsconfig.json frontend/next.config.ts
git add frontend/tailwind.config.ts frontend/postcss.config.mjs
git add frontend/src/app/layout.tsx frontend/src/app/globals.css
git add frontend/src/types/ frontend/src/lib/ frontend/.env.example
git commit -m "Add Next.js frontend foundation with API client and types"
git push
```

### Step 7 — Frontend Pages & Components

```bash
git add frontend/src/components/ frontend/src/context/
git add frontend/src/app/page.tsx frontend/src/app/products/
git add frontend/src/app/cart/ frontend/src/app/checkout/
git add frontend/src/app/login/ frontend/src/app/orders/
git add frontend/src/app/admin/
git commit -m "Add storefront pages, cart, checkout, and admin dashboard"
git push
```

### Step 8 — CI/CD

```bash
git add .github/
git commit -m "Add GitHub Actions CI pipeline for backend and frontend"
git push
```

> **Note:** `.env`, `.env.local`, `node_modules/`, `.next/` push කරන්න එපා — `.gitignore` එකේ already exclude කරලා තියෙනවා.

---

## Quick Start

### 1. Start Database

```bash
docker compose up postgres -d
```

### 2. Backend

```bash
cd backend
cp .env.example .env
npm install
npx prisma db push
npm run prisma:seed
npm run start:dev
```

API: http://localhost:4000/api

### 3. Frontend

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

App: http://localhost:3000

---

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@shop.com | admin123 |
| User | user@shop.com | user123 |

---

## API Endpoints

```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me
GET    /api/products
GET    /api/products/:slug
GET    /api/categories
POST   /api/orders
GET    /api/orders/my
PATCH  /api/orders/:id/status   (admin)
GET    /api/products/inventory    (admin)
GET    /api/orders                (admin)
POST   /api/payments/create-intent
POST   /api/payments/webhook      (Stripe)
```

---

## Docker (Full Stack)

```bash
docker compose up --build
```

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret for signing JWT tokens |
| `STRIPE_SECRET_KEY` | Stripe API secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `FRONTEND_URL` | Frontend URL for CORS |
| `PORT` | API port (default: 4000) |

### Frontend (`frontend/.env.local`)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL (e.g. `http://localhost:4000/api`) |

---

## Author

Pathum Randeepa — Full Stack Developer
