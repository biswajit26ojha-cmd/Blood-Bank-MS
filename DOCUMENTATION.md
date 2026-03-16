# 📖 Blood Bank Management System — Full Documentation

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Database Schema](#database-schema)
3. [API Reference](#api-reference)
4. [Frontend Architecture](#frontend-architecture)
5. [Authentication & Authorization](#authentication--authorization)
6. [Role Permissions Matrix](#role-permissions-matrix)
7. [Default Credentials](#default-credentials)
8. [Environment Variables](#environment-variables)
9. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

```
Browser (Vue 3 SPA)
        │
        │  HTTP / JSON (REST)
        ▼
Express.js API  (localhost:3000)
        │
        │  mysql2 connection pool
        ▼
MySQL 8 Database  (bloodbank)
```

- The **frontend** (Vite + Vue 3) runs on port `5173` in development.
- The **backend** (Express) runs on port `3000` and proxies `/api/*` requests from Vite during development.
- All state is managed via **Pinia** stores; data is fetched from the backend API on login.

---

## Database Schema

### `users`
| Column | Type | Notes |
|---|---|---|
| `id` | VARCHAR(36) | UUID primary key |
| `name` | VARCHAR(120) | Full name |
| `email` | VARCHAR(120) | Unique |
| `password` | VARCHAR(255) | bcrypt hash |
| `role` | ENUM | `admin`, `staff`, `doctor`, `nurse`, `user` |
| `created_at` | DATETIME | Auto |

### `donors`
| Column | Type | Notes |
|---|---|---|
| `id` | VARCHAR(36) | UUID primary key |
| `name` | VARCHAR(120) | |
| `blood_type` | VARCHAR(5) | e.g. `O+` |
| `age` | INT | |
| `phone` | VARCHAR(30) | Nullable |
| `email` | VARCHAR(120) | Nullable |
| `city` | VARCHAR(80) | Nullable |
| `last_donation` | DATE | Nullable |
| `total_donations` | INT | Default 0 |
| `status` | ENUM | `Active`, `Inactive` |
| `created_at` | DATETIME | Auto |

### `inventory`
| Column | Type | Notes |
|---|---|---|
| `blood_type` | VARCHAR(5) | Primary key (e.g. `O+`) |
| `units` | INT | Current stock |
| `min_threshold` | INT | Alert threshold (default 10) |
| `updated_at` | DATETIME | Auto-updated |

### `blood_requests`
| Column | Type | Notes |
|---|---|---|
| `id` | VARCHAR(36) | UUID primary key |
| `patient_name` | VARCHAR(120) | |
| `hospital` | VARCHAR(120) | |
| `blood_type` | VARCHAR(5) | |
| `units` | INT | |
| `urgency` | ENUM | `Low`, `Medium`, `High`, `Critical` |
| `status` | ENUM | `Pending`, `Approved`, `Fulfilled`, `Rejected` |
| `notes` | TEXT | Nullable |
| `requested_by` | VARCHAR(36) | FK → users.id |
| `request_date` | DATE | Auto |
| `resolved_date` | DATE | Nullable |

### `external_requests`
| Column | Type | Notes |
|---|---|---|
| `id` | VARCHAR(36) | UUID primary key |
| `direction` | ENUM | `incoming`, `outgoing` |
| `bank_name` | VARCHAR(120) | Partner bank name |
| `contact_name` | VARCHAR(120) | |
| `contact_phone` | VARCHAR(30) | Nullable |
| `contact_email` | VARCHAR(120) | Nullable |
| `blood_type` | VARCHAR(5) | |
| `units` | INT | |
| `urgency` | VARCHAR(20) | |
| `reason` | TEXT | Nullable |
| `notes` | TEXT | Nullable |
| `status` | VARCHAR(30) | Default `Pending` |
| `request_date` | DATE | Auto |
| `resolved_date` | DATE | Nullable |

### `activity_log`
| Column | Type | Notes |
|---|---|---|
| `id` | VARCHAR(36) | UUID primary key |
| `type` | VARCHAR(60) | e.g. `donation`, `request`, `fulfill` |
| `message` | TEXT | Human-readable description |
| `created_at` | DATETIME | Auto |

---

## API Reference

All endpoints are prefixed with `/api`. The Vite dev proxy forwards `/api/*` to `http://localhost:3000/api/*`.

### Authentication Header
```
Authorization: Bearer <jwt_token>
```

---

### Auth — `/api/auth`

| Method | Path | Access | Description |
|---|---|---|---|
| POST | `/auth/register` | Public | Register a new patient account |
| POST | `/auth/login` | Public | Login (non-admin users) |
| POST | `/auth/admin-login` | Public | Login for admin accounts |
| GET | `/auth/me` | Any authenticated | Get current user info |
| POST | `/auth/change-password` | Any authenticated | Change own password |

#### POST `/auth/register`
```json
// Request
{ "name": "Jane Doe", "email": "jane@example.com", "password": "Secret123" }

// Response 201
{ "message": "Registered successfully" }
```

#### POST `/auth/login`
```json
// Request
{ "email": "jane@example.com", "password": "Secret123" }

// Response 200
{ "token": "<jwt>", "user": { "id": "...", "name": "Jane Doe", "email": "...", "role": "user" } }
```

#### POST `/auth/admin-login`
```json
// Request
{ "email": "admin@bloodbank.local", "password": "Admin@123" }

// Response 200
{ "token": "<jwt>", "user": { "id": "...", "role": "admin" } }
```

---

### Users — `/api/users` *(Admin only)*

| Method | Path | Description |
|---|---|---|
| GET | `/users` | List all users |
| PATCH | `/users/:id/role` | Change a user's role |
| POST | `/users/:id/reset-password` | Reset a user's password |
| DELETE | `/users/:id` | Delete a user |

---

### Donors — `/api/donors` *(Staff only)*

| Method | Path | Description |
|---|---|---|
| GET | `/donors` | List all donors |
| POST | `/donors` | Add a new donor |
| PATCH | `/donors/:id` | Update donor details |
| POST | `/donors/:id/record-donation` | Record a donation (+1 unit to inventory) |
| DELETE | `/donors/:id` | Delete a donor |

#### POST `/donors`
```json
{
  "name": "Alice Johnson",
  "blood_type": "O+",
  "age": 28,
  "phone": "555-0101",       // optional
  "email": "alice@ex.com",   // optional
  "city": "New York",        // optional
  "last_donation": "2025-11-10", // optional, ISO date
  "status": "Active"
}
```

---

### Inventory — `/api/inventory`

| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/inventory` | Any authenticated | Get all blood type stock levels |
| POST | `/inventory/adjust` | Staff only | Add or deduct units |
| PATCH | `/inventory/:blood_type/threshold` | Staff only | Update minimum threshold |

#### POST `/inventory/adjust`
```json
// Request
{ "blood_type": "O+", "action": "add", "units": 5, "reason": "Donation received" }
// action: "add" | "deduct"

// Response 200
{ "blood_type": "O+", "units": 43 }
```

---

### Blood Requests — `/api/requests` *(Staff only)*

| Method | Path | Description |
|---|---|---|
| GET | `/requests` | List all blood requests |
| POST | `/requests` | Create a new request |
| PATCH | `/requests/:id/status` | Update request status |
| DELETE | `/requests/:id` | Delete a request |

#### POST `/requests`
```json
{
  "patient_name": "John Smith",
  "hospital": "City General Hospital",
  "blood_type": "O+",
  "units": 2,
  "urgency": "High",
  "notes": "Pre-surgery"   // optional
}
```

#### PATCH `/requests/:id/status`
```json
{ "status": "Fulfilled" }
// status: "Pending" | "Approved" | "Fulfilled" | "Rejected"
```

---

### External / Inter-Bank Requests — `/api/external-requests` *(Staff only)*

| Method | Path | Description |
|---|---|---|
| GET | `/external-requests` | List all (optionally filter by `?direction=incoming\|outgoing`) |
| POST | `/external-requests` | Create incoming or outgoing request |
| PATCH | `/external-requests/:id/status` | Update status |

#### POST `/external-requests`
```json
{
  "direction": "incoming",
  "bank_name": "Metro Blood Centre",
  "contact_name": "Dr. Priya Sharma",
  "contact_phone": "555-2001",        // optional
  "contact_email": "priya@metro.org", // optional
  "blood_type": "O-",
  "units": 4,
  "urgency": "Critical",
  "reason": "Mass casualty incident", // optional
  "notes": ""                          // optional
}
```

---

### Activity Log — `/api/activity` *(Staff only)*

| Method | Path | Description |
|---|---|---|
| GET | `/activity?limit=100` | Fetch recent activity entries |

---

## Frontend Architecture

### Stores (Pinia)

#### `auth.js`
| State | Type | Description |
|---|---|---|
| `currentUser` | ref | Logged-in user object (persisted in localStorage) |
| `users` | ref | All users list (admin only) |
| `isLoggedIn` | computed | True if session active |
| `isAdmin` | computed | True if role = admin |
| `isStaff` | computed | True if role ∈ {admin, staff, doctor, nurse} |
| `isUser` | computed | True if role = user |

Key actions: `login()`, `adminLogin()`, `register()`, `logout()`, `restoreSession()`, `fetchUsers()`, `updateRole()`, `resetPassword()`, `deleteUser()`

#### `bloodBank.js`
| State | Type | Description |
|---|---|---|
| `donors` | ref | Array of donor objects |
| `inventory` | ref | Array of `{ blood_type, units, min_threshold }` |
| `requests` | ref | Array of blood requests |
| `activityLog` | ref | Array of activity entries |
| `externalRequests` | ref | Array of inter-bank requests |
| `userSubmissions` | ref | Local patient submissions (localStorage) |
| `loading` | ref | Per-feature loading flags |

Key computed: `totalDonors`, `activeDonors`, `totalUnits`, `criticalStock`, `pendingRequests`, `pendingExternalRequests`

### Router Guards

```
requiresAuth  → redirects to /login if not logged in
requiresStaff → redirects to /login if not staff/admin
requiresUser  → redirects to /user-dashboard if not patient role
adminPublic   → redirects to / if already logged in as admin
public        → redirects to / or /user-dashboard if already logged in
```

### Services — `api.js`

Centralised fetch wrapper. All requests attach the JWT from localStorage automatically. Throws an `Error` with the server's `error` message on non-2xx responses.

---

## Authentication & Authorization

1. User logs in → server validates credentials → returns signed JWT + user object
2. Frontend stores JWT in `localStorage` under key `bb_token`
3. Every API request includes `Authorization: Bearer <token>`
4. Backend middleware `authenticate` verifies the JWT and attaches `req.user`
5. `requireStaff` middleware checks `req.user.role` ∈ `{admin, staff, doctor, nurse}`
6. Admin-only routes additionally check `req.user.role === 'admin'`

---

## Role Permissions Matrix

| Feature | Patient | Staff | Admin |
|---|---|---|---|
| View blood inventory | ✅ | ✅ | ✅ |
| Search blood availability | ✅ | ✅ | ✅ |
| Submit blood request (user form) | ✅ | — | — |
| Submit donation application | ✅ | — | — |
| Submit inter-bank request (user) | ✅ | — | — |
| Manage donors | — | ✅ | ✅ |
| Adjust inventory | — | ✅ | ✅ |
| Manage blood requests | — | ✅ | ✅ |
| Manage inter-bank requests | — | ✅ | ✅ |
| Review donation applications | — | ✅ | ✅ |
| View activity log | — | ✅ | ✅ |
| Manage users | — | — | ✅ |
| Change user roles | — | — | ✅ |
| System settings | — | — | ✅ |

---

## Default Credentials

| Role | Email | Password |
|---|---|---|
| Admin | `admin@bloodbank.local` | `Admin@123` |
| Patient | Register via `/register` | — |

> Change the admin password after first login via the Admin → User Management panel.

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | Backend server port |
| `FRONTEND_URL` | `http://localhost:5173` | CORS allowed origin |
| `JWT_SECRET` | *(required)* | Secret for signing JWTs — use a long random string in production |
| `DB_HOST` | `localhost` | MySQL host |
| `DB_PORT` | `3306` | MySQL port |
| `DB_USER` | `root` | MySQL user |
| `DB_PASSWORD` | *(required)* | MySQL password |
| `DB_NAME` | `bloodbank` | MySQL database name |

---

## Troubleshooting

### Backend won't start — `ECONNREFUSED`
MySQL is not running. Start the MySQL service:
```powershell
net start MySQL80
```

### `Access denied for user 'root'`
The password in `.env` is wrong or the `#` character is treated as a comment.
**Fix:** Wrap your password in double quotes:
```env
DB_PASSWORD="YourP@ss#word"
```

### Inventory shows 0 / empty
The inventory table has no rows. On the **Inventory** page (staff login), click **"🩸 Initialise Blood Inventory"** to seed all 8 blood types.

### White screen / JS error
Check the browser console (F12). Common causes:
- Vite dev server not running → run `npm run dev`
- Backend not running → run `node server.js` in `backend/`
- Duplicate store definition — ensure `bloodBank.js` has only one `export const useBloodBankStore`

### Port already in use
```powershell
netstat -ano | findstr :3000   # find PID
taskkill /PID <PID> /F         # kill it
```

### JWT expired / user logged out unexpectedly
The default JWT expiry is set in `backend/middleware/auth.js`. Increase it if needed:
```js
jwt.sign(payload, secret, { expiresIn: '7d' })
```
