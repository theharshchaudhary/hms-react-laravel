# MediCore HMS — Hospital Management System

A full-stack hospital management system.

| Layer | Stack | Folder |
| ----- | ----- | ------ |
| Frontend | React 18 + TypeScript + Vite + Tailwind | [`frontend/`](frontend/) |
| Backend | Laravel 13 + Sanctum + MySQL | [`backend/`](backend/) |

The frontend was built first against an in-memory mock. The backend implements
that exact API contract, so the two line up field-for-field (the API speaks
`camelCase` JSON, no `data` envelope).

---

## Features

- **Auth** — register / login / logout with Sanctum bearer tokens, 3 roles
  (`admin`, `doctor`, `receptionist`), profile + password management.
- **Role-based access** — enforced server-side via a `role:` middleware.
- **CRUD modules** — patients, doctors, departments, appointments, patient
  queue, prescriptions, medical records, invoices.
- **Analytics** — dashboard overview and reports summary computed live from
  the database (revenue trends, appointment status, weekly load, bed occupancy).
- **Public site** — landing page pulls live doctors, departments, testimonials,
  facilities and hospital stats; contact form persists messages.
- **Production concerns** — request validation, API Resources, CORS allow-list,
  rate limiting, seeders with realistic demo data, `.env.example` for both apps.

---

## Prerequisites

- PHP 8.3+ with `pdo_mysql`, Composer
- Node 18+ and npm
- A MySQL server (XAMPP / Laragon / Docker / native)

> **SQLite alternative:** set `DB_CONNECTION=sqlite` in `backend/.env` and run
> `touch backend/database/database.sqlite` instead of creating a MySQL database.

---

## Setup

### 1. Backend

```bash
cd backend
cp .env.example .env

# create the database (MySQL)
mysql -u root -e "CREATE DATABASE hms_backend CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
# adjust DB_USERNAME / DB_PASSWORD in .env if your MySQL isn't root/no-password

composer install
php artisan key:generate
php artisan migrate:fresh --seed        # creates schema + demo data

php artisan serve --host=127.0.0.1 --port=8001
```

API is now at `http://localhost:8001/api`.
(`composer setup` runs the install + migrate + seed steps in one go;
`composer serve` starts the server on 8001; `composer fresh` re-seeds.)

### 2. Frontend

```bash
cd frontend
cp .env.example .env          # VITE_API_URL=http://localhost:8001/api
npm install
npm run dev                   # http://localhost:5173
```

---

## Demo accounts

| Role | Email | Password |
| ---- | ----- | -------- |
| Admin | `admin@medicore.com` | `admin123` |
| Doctor | `doctor@medicore.com` | `doctor123` |
| Receptionist | `reception@medicore.com` | `reception123` |

---

## API overview

Base URL: `http://localhost:8001/api`

### Public
| Method | Path | Notes |
| ------ | ---- | ----- |
| POST | `/auth/register` | `{ name, email, password, password_confirmation, role }` |
| POST | `/auth/login` | → `{ token, user }` |
| POST | `/contact` | landing-page contact form |
| GET | `/public/doctors` `/public/departments` `/public/testimonials` `/public/facilities` `/public/stats` | landing page data |

### Authenticated (`Authorization: Bearer <token>`)
| Method | Path | Role |
| ------ | ---- | ---- |
| POST | `/auth/logout` | any |
| GET | `/auth/user` | any |
| PUT | `/auth/profile` · `/auth/password` | any |
| GET/POST/PUT/DELETE | `/patients`, `/appointments` | any |
| GET | `/queue` · POST `/queue` · PUT `/queue/{id}` | any |
| GET | `/doctors`, `/departments`, `/prescriptions`, `/records`, `/invoices` | any |
| POST/PUT/DELETE | `/doctors`, `/departments` | admin |
| POST/PUT | `/prescriptions` · POST `/records` | admin, doctor |
| POST/PUT | `/invoices` | admin, receptionist |
| GET | `/dashboard/overview` | any |
| GET | `/reports/summary` | admin |

---

## Project layout

```
backend/
  app/Http/Controllers/Api/   REST controllers
  app/Http/Resources/         camelCase JSON transformers
  app/Http/Middleware/        EnsureUserRole
  app/Models/                 Eloquent models
  database/migrations/        schema
  database/seeders/           DatabaseSeeder — demo data
  routes/api.php              all routes
frontend/
  src/services/api.ts         typed API client (fetch + bearer token)
  src/context/AuthContext.tsx auth state, token bootstrap
  src/pages/                  landing, auth, dashboard modules
```

