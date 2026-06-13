
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

-
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


