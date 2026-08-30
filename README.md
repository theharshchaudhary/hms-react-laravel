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

## Roles & access

| Role | How it's created | Where it lands | Can do |
| ---- | ---------------- | -------------- | ------ |
| `super_admin` | seeded / another super admin | staff dashboard | everything, incl. **User Management** (create/edit/delete staff, assign roles, link doctor profiles) |
| `admin` | super admin | staff dashboard | all clinical + billing + config + the **Messages** inbox, **not** user management |
| `doctor` | super admin (linked to a **doctor profile**) | staff dashboard | **only their own** patients, appointments, prescriptions, records, queue |
| `receptionist` | super admin | staff dashboard | patients, appointments, queue, billing (cannot delete patients) |
| `patient` | **public `/register`** (only role available there) | patient portal | book / reschedule / cancel own appointments, view prescriptions + request refills, view records, view + download invoices (PDF), edit profile |

A `doctor` login is tied to a specific doctor profile (`users.doctor_id`), so every
staff list and the dashboard are automatically scoped to that doctor's own work.

The public registration page **only** creates patients. Staff accounts are
created exclusively by a super admin via the dashboard's *User Management* page.

---

## Features

- **Auth** — register / login / logout with Sanctum bearer tokens; profile +
  password management for every role.
- **Role-based access** — enforced server-side via a `role:` middleware, per route.
- **Staff back-office** — full CRUD for patients (+ admit/discharge), doctors,
  departments, appointments (+ check-in → queue), the patient queue (+ walk-ins,
  atomic re-order), prescriptions (+ refill-request inbox), medical records,
  invoices (+ create, record payments, PDF), a contact-message inbox, live
  analytics, downloadable PDF reports, and staff user management.
- **Workflow links** — checking in an appointment creates a queue token; marking
  a consult *Completed* prompts an invoice and stamps the patient's last visit;
  department doctor-counts and bed-occupancy are derived from real data.
- **Patient portal** — a separate logged-in area scoped to the patient's own
  records: appointments (with double-booking / on-leave guards), prescriptions +
  refill requests, medical records, downloadable invoices, profile & password.
- **Analytics** — dashboard overview and reports summary computed live from the
  database (revenue trends, appointment status, weekly load, bed occupancy).
- **Public site** — landing page pulls live doctors, departments, testimonials,
  facilities and hospital stats; contact form persists messages.
- **Production concerns** — request validation, API Resources, CORS allow-list,
  rate limiting, invoice PDFs (dompdf), seeders with realistic demo data,
  `.env.example` for both apps.

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
(`composer setup` runs install + migrate + seed in one go;
`composer serve` starts the server on 8001; `composer fresh` re-seeds.)

### 2. Frontend

```bash
cd frontend
cp .env.example .env          # VITE_API_URL=http://localhost:8001/api
npm install
npm run dev                   # http://localhost:5174
```

> Ports: the API runs on **8001** and the app on **5174** (5173/8000 are
> commonly taken by other local projects). Both are pinned in `vite.config.ts`
> and `backend/.env` (`CORS_ALLOWED_ORIGINS`). To change the app port, update
> both places.

---

## Demo accounts

| Role | Email | Password |
| ---- | ----- | -------- |
| Super Admin | `super@medicore.com` | `super123` |
| Admin | `admin@medicore.com` | `admin123` |
| Doctor | `doctor@medicore.com` | `doctor123` |
| Receptionist | `reception@medicore.com` | `reception123` |
| Patient | `patient@medicore.com` | `patient123` |

---

## API overview

Base URL: `http://localhost:8001/api`

### Public
| Method | Path | Notes |
| ------ | ---- | ----- |
| POST | `/auth/register` | creates a **patient** — `{ name, email, password, password_confirmation, phone? }` |
| POST | `/auth/login` | → `{ token, user }` |
| POST | `/contact` | landing-page contact form |
| GET | `/public/{doctors,departments,testimonials,facilities,stats}` | landing page data |

### Shared (any authenticated user)
`POST /auth/logout` · `GET /auth/user` · `PUT /auth/profile` · `PUT /auth/password`

### Staff back-office (`role: super_admin | admin | doctor | receptionist`)
| Method | Path | Restricted to |
| ------ | ---- | ------------- |
| GET/POST/PUT | `/patients` · DELETE `/patients/{id}` | any staff / **admin+** |
| GET/POST/PUT/DELETE | `/appointments` · POST `/appointments/{id}/check-in` | any staff |
| GET/POST `/queue` · POST `/queue/reorder` · PUT `/queue/{id}` | any staff |
| GET | `/doctors` (`?unlinked=1`) `/departments` `/prescriptions` (`?refillRequested=1`) `/records` `/invoices` `/invoices/{id}/pdf` | any staff |
| GET | `/dashboard/overview` | any staff (auto-scoped for doctors) |
| POST/PUT | `/prescriptions` · POST `/records` | super_admin, admin, doctor |
| POST/PUT | `/invoices` | super_admin, admin, receptionist |
| POST/PUT/DELETE | `/doctors`, `/departments` · GET `/reports/summary` · `/reports/pdf?type=…` · `/messages` (index/update/destroy) | super_admin, admin |
| GET/POST/PUT/DELETE | `/users` | **super_admin only** |

### Patient portal (`role: patient`)
| Method | Path |
| ------ | ---- |
| GET | `/portal/dashboard` · `/portal/profile` · PUT `/portal/profile` |
| GET/POST | `/portal/appointments` · PUT `/portal/appointments/{id}` (reschedule / `{action:"cancel"}`) |
| GET | `/portal/prescriptions` · POST `/portal/prescriptions/{id}/refill` |
| GET | `/portal/records` |
| GET | `/portal/invoices` · `/portal/invoices/{id}/pdf` |

---

## Project layout

```
backend/
  app/Http/Controllers/Api/   AuthController, {Patient,Doctor,...}Controller,
                              UserController (staff mgmt), PortalController (patient)
  app/Http/Resources/         camelCase JSON transformers
  app/Http/Middleware/        EnsureUserRole
  app/Models/                 Eloquent models (User ↔ Patient link)
  database/migrations/        schema
  database/seeders/           DatabaseSeeder — demo data (5 roles)
  resources/views/pdf/        invoice.blade.php (dompdf)
  routes/api.php              all routes
frontend/
  src/services/api.ts         typed API client (authApi, userApi, portalApi, …)
  src/context/AuthContext.tsx auth state, token bootstrap, role-based landing
  src/pages/DashboardPage     staff back-office shell + role gating
  src/pages/PortalPage        patient portal shell
  src/pages/portal/           patient portal modules
  src/pages/dashboard/UsersPage.tsx   super-admin staff management
```
