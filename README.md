# Starlight WorkOrder Portal

A production-ready bilingual (English + Simplified Chinese) work order management system for Starlight Business Consulting.

## Features

- **Client Portal** - Clients check work order status using order number + password (no signup required)
- **Admin Dashboard** - Staff manage work orders, view analytics, and update statuses
- **Bilingual** - Full English & Simplified Chinese support with one-click switching
- **Status State Machine** - Enforced status transitions with full audit trail
- **Feishu Ready** - Prepared for Feishu Base integration as source of truth
- **Notification Hooks** - Abstraction layer for email & webhook notifications

## Tech Stack

- **Frontend**: Next.js 14, React 18, Tailwind CSS
- **Backend**: Next.js API Routes with layered architecture (Controller/Service/Repository)
- **Database**: PostgreSQL with Prisma ORM
- **Auth**: JWT (httpOnly cookies), bcrypt password hashing
- **Security**: Rate limiting, account lockout, XSS sanitization, CSRF protection

## Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 16+

### Local Development

```bash
# 1. Clone and install
cd starlight-workorder
npm install

# 2. Set up environment
cp .env.example .env
# Edit .env with your database URL and JWT secrets

# 3. Set up database
npx prisma generate
npx prisma db push
npm run db:seed

# 4. Start development server
npm run dev
```

Open http://localhost:3000

### Docker Deployment

```bash
# Generate secrets first
export JWT_SECRET=$(openssl rand -base64 64)
export JWT_REFRESH_SECRET=$(openssl rand -base64 64)

# Start with Docker Compose
docker compose up -d

# Run migrations and seed (first time only)
docker compose exec app npx prisma db push
docker compose exec app npm run db:seed
```

## Default Credentials

After seeding:

| Role | Email/ID | Password |
|------|----------|----------|
| Admin | admin@starlight.com | admin123 |
| Staff | zhang.wei@starlight.com | staff123 |
| Staff | li.na@starlight.com | staff123 |

Sample work orders are created with passwords `client001` through `client004`. Work order numbers are printed during seeding.

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes (Controllers)
│   │   ├── admin/         # Admin endpoints
│   │   ├── client/        # Client endpoints
│   │   └── auth/          # Auth endpoints
│   ├── admin/             # Admin pages
│   └── client/            # Client pages
├── components/            # React components
├── i18n/                  # Internationalization
│   └── locales/           # en.json, zh.json
├── lib/                   # Core utilities
│   ├── auth.ts           # JWT helpers
│   ├── prisma.ts         # Database client
│   ├── rate-limiter.ts   # Rate limiting
│   ├── status-machine.ts # FSM transitions
│   └── validators.ts     # Zod schemas
├── repositories/          # Data access layer
├── services/             # Business logic layer
│   ├── auth.service.ts
│   ├── workorder.service.ts
│   ├── comment.service.ts
│   ├── dashboard.service.ts
│   ├── feishu.service.ts
│   └── notification.service.ts
├── types/                # TypeScript types
└── middleware.ts         # Route protection
```

## API Endpoints

### Client

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/client/login` | Client login with order# + password |
| GET | `/api/client/workorder/me` | Get own work order details |
| POST | `/api/client/comment` | Add comment to work order |

### Admin

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/admin/login` | Staff login |
| GET | `/api/admin/workorders` | List work orders (paginated) |
| GET | `/api/admin/workorders?export=csv` | Export as CSV |
| POST | `/api/admin/workorders` | Create work order |
| GET | `/api/admin/workorder/:id` | Get work order details |
| PATCH | `/api/admin/workorder/:id` | Update work order |
| POST | `/api/admin/workorder/:id` | Add comment |
| GET | `/api/admin/dashboard` | Dashboard statistics |
| POST | `/api/admin/sync-feishu` | Trigger Feishu sync |
| GET | `/api/admin/staff` | List staff members |

## Status Flow

```
DRAFT → RECEIVED → IN_PROGRESS → COMPLETED → CLOSED
                        ↓↑
              WAITING_FOR_CLIENT
              WAITING_FOR_THIRD_PARTY

Any active status → CANCELLED (terminal)
```

## Feishu Integration

Set the following environment variables to enable Feishu Base sync:

```env
FEISHU_APP_ID=your_app_id
FEISHU_APP_SECRET=your_app_secret
FEISHU_BASE_APP_TOKEN=your_base_token
FEISHU_TABLE_ID=your_table_id
```

**Sync Strategy:**
- Feishu Base = source of truth for: status, due_date, assigned_staff
- Local DB = source of truth for: comments, audit logs
- Manual sync via admin dashboard button
- Scheduled sync support (implement via cron/external scheduler)

## Security

- Passwords hashed with bcrypt (12 rounds)
- JWT tokens in httpOnly cookies
- Rate limiting on login endpoints
- Account lockout after 5 failed attempts (15 min)
- XSS input sanitization
- CSRF protection via SameSite cookies
- Security headers (X-Frame-Options, X-Content-Type-Options, etc.)

## License

Proprietary - Starlight Business Consulting
