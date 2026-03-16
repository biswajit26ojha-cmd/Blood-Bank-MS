# 🩸 Blood Bank Management System

A full-stack Blood Bank Management System built with **Vue 3** (frontend) and **Node.js / Express / MySQL** (backend). Supports multiple user roles with dedicated portals for patients, staff, and administrators.

---

## 🚀 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Vue 3, Pinia, Vue Router 4, Vite |
| Backend | Node.js, Express.js |
| Database | MySQL 8+ (via `mysql2`) |
| Auth | JWT (JSON Web Tokens) + bcryptjs |

No external UI library — all custom scoped CSS.

---

## ⚙️ Prerequisites

- **Node.js** v18+
- **MySQL 8+** (running locally or remote)
- **npm** v9+

---

## 🛠 Setup & Installation

### 1. Clone / Open the project

```bash
cd "Blood Bank"
```

### 2. Install frontend dependencies

```bash
npm install
```

### 3. Install backend dependencies

```bash
cd backend
npm install
```

### 4. Configure environment

Create a `.env` file inside the `backend/` folder:

```env
PORT=3000
FRONTEND_URL=http://localhost:5173
JWT_SECRET=your-long-random-secret-here

DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD="your_mysql_password"
DB_NAME=bloodbank
```

> ⚠️ If your password contains special characters like `#`, wrap it in double quotes.

### 5. Create the MySQL database

Open MySQL Workbench or a MySQL shell and run:

```sql
CREATE DATABASE IF NOT EXISTS bloodbank CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 6. Start the backend

```bash
cd backend
node server.js
```

On first run, the server will automatically:
- Create all required tables (`users`, `donors`, `inventory`, etc.)
- Seed the default admin account → `admin@bloodbank.local` / `Admin@123`
- Seed inventory with default blood unit values

Expected output:
```
✅ DB migration complete
✅ Default admin seeded  →  admin@bloodbank.local  /  Admin@123
🩸 Blood Bank API running at http://localhost:3000
```

### 7. Start the frontend

In a separate terminal:

```bash
npm run dev
```

Open **http://localhost:5173** in your browser.

---

## 👥 User Roles & Portals

### 🛡 Admin
- Full access to all features
- User management (view, change roles, delete)
- Activity audit log
- System settings

**Login:** `/admin-login` → `admin@bloodbank.local` / `Admin@123`

### 🏥 Staff (doctor / nurse / staff)
- Donor management
- Blood inventory management
- Blood request management
- Inter-bank request management
- Donation application review

**Login:** `/login` (staff accounts created by admin)

### 👤 Patient / User
- Search live blood availability
- Submit blood requests
- Apply to donate blood
- Request from partner blood banks

**Register:** `/register` → then login at `/login`

---

## 📁 Project Structure

```
Blood Bank/
├── index.html
├── package.json
├── vite.config.js
├── README.md
├── DOCUMENTATION.md
├── backend/
│   ├── server.js              # Express app entry point
│   ├── package.json
│   ├── .env                   # Environment config (create this)
│   ├── db/
│   │   └── database.js        # MySQL pool, migrations, seeds
│   ├── middleware/
│   │   └── auth.js            # JWT authenticate & requireStaff guards
│   └── routes/
│       ├── auth.js            # Login, register, /me
│       ├── users.js           # Admin user management
│       ├── donors.js          # Donor CRUD
│       ├── inventory.js       # Inventory view & adjust
│       ├── requests.js        # Blood requests CRUD
│       ├── externalRequests.js# Inter-bank requests
│       └── activity.js        # Activity log
└── src/
    ├── main.js
    ├── App.vue                # Root layout + session restore
    ├── components/
    │   ├── Navbar.vue         # Staff/admin sidebar
    │   └── UserNavbar.vue     # Patient sidebar
    ├── router/
    │   └── index.js           # Routes & navigation guards
    ├── services/
    │   └── api.js             # Centralised API client
    ├── stores/
    │   ├── auth.js            # Auth store (Pinia)
    │   └── bloodBank.js       # Blood bank data store (Pinia)
    └── views/
        ├── Dashboard.vue
        ├── Donors.vue
        ├── Inventory.vue
        ├── Requests.vue
        ├── ExternalRequests.vue
        ├── DonationApplications.vue
        ├── Compatibility.vue
        ├── Admin.vue
        ├── Login.vue
        ├── Register.vue
        ├── AdminLogin.vue
        └── user/
            ├── UserDashboard.vue
            ├── BloodSearch.vue
            ├── RequestBlood.vue
            ├── DonateBlood.vue
            ├── ExternalBankRequest.vue
            └── Contact.vue
```

---

## 🔑 Features

### Staff Portal
| Feature | Description |
|---|---|
| **Dashboard** | Overview stats, critical stock alerts, recent activity |
| **Donors** | Add, edit, delete donors; record donations |
| **Inventory** | View and adjust blood unit stock; adjustment log |
| **Requests** | Create and manage internal blood transfusion requests |
| **Inter-Bank** | Incoming (approve/decline) and Outgoing requests |
| **Donation Applications** | Review and approve/reject patient donation applications |
| **Compatibility** | Blood type compatibility reference tool |

### Patient Portal
| Feature | Description |
|---|---|
| **Search Blood** | Live blood type availability with compatibility chart |
| **Request Blood** | Submit a blood request |
| **Donate Blood** | Apply to donate; reviewed by staff |
| **Other Blood Banks** | Request from partner bank network |
| **Contact** | Contact form |

---

## 🔀 API Endpoints

See [DOCUMENTATION.md](DOCUMENTATION.md) for the full API reference.

---

## 🔒 Security

- Passwords hashed with **bcryptjs** (10 salt rounds)
- Auth via signed **JWT** tokens (Bearer scheme)
- Role-based access control on all write endpoints
- SQL injection prevented via parameterised queries (`mysql2`)
- CORS restricted to the configured `FRONTEND_URL`


---

## 🚀 Tech Stack

| Tech | Version |
|---|---|
| Vue 3 | ^3.4.0 |
| Pinia | ^2.1.7 |
| Vue Router | ^4.3.0 |
| Vite | ^5.1.0 |

No external UI library — all custom scoped CSS.

---

## ⚙️ Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## 👥 User Roles & Portals

### 🛡 Admin
- Full access to all staff features
- User management (create, delete, change roles)
- View activity log
- Manage inter-bank requests from the admin console

**Login:** Use the **Admin Login** page (`/admin-login`)

### 🏥 Staff (doctor / nurse / staff)
- Access to all internal management pages via the sidebar

**Login:** Use the main **Login** page (`/login`)

### 👤 Patient / User
- Access to the user portal with personal dashboard

**Login:** Register via `/register`, then log in at `/login`

---

## 📁 Project Structure

```
src/
├── components/
│   ├── Navbar.vue          # Staff/admin sidebar shell layout
│   └── UserNavbar.vue      # Patient sidebar shell layout
├── router/
│   └── index.js            # Route definitions & guards
├── stores/
│   ├── auth.js             # Auth state (login, register, roles)
│   └── bloodBank.js        # All blood bank data & operations
└── views/
    ├── Dashboard.vue           # Staff dashboard
    ├── Donors.vue              # Donor management
    ├── Inventory.vue           # Blood inventory management
    ├── Requests.vue            # Internal blood requests
    ├── ExternalRequests.vue    # Inter-bank requests (incoming + outgoing)
    ├── DonationApplications.vue# Review user donation applications
    ├── Compatibility.vue       # Blood type compatibility checker
    ├── Admin.vue               # Admin console
    ├── Login.vue               # Staff/user login
    ├── Register.vue            # Patient registration
    ├── AdminLogin.vue          # Admin-only login
    └── user/
        ├── UserDashboard.vue       # Patient home
        ├── BloodSearch.vue         # Search blood availability
        ├── RequestBlood.vue        # Submit blood request
        ├── DonateBlood.vue         # Apply to donate blood
        ├── ExternalBankRequest.vue # Request from partner banks
        └── Contact.vue             # Contact page
```

---

## 🔑 Features

### Staff Portal
| Feature | Description |
|---|---|
| **Dashboard** | Overview stats, critical stock alerts, recent activity |
| **Donors** | Add, edit, delete donors; record donations; horizontal scrollable table |
| **Inventory** | View and adjust blood unit stock per type; adjustment log |
| **Requests** | Create and manage internal blood transfusion requests; hospital name auto-suggest |
| **Inter-Bank** | Two-tab view — Incoming (approve/decline) and Outgoing (send/receive); bank name auto-suggest |
| **Donation Applications** | Review and approve/reject patient donation applications; auto-registers approved donors |
| **Compatibility** | Blood type compatibility reference tool |

### Admin Console
| Tab | Description |
|---|---|
| **User Management** | View all registered users, change roles, delete accounts |
| **Inter-Bank Requests** | Manage incoming requests from partner banks |
| **Activity Log** | Full audit trail of all system events |
| **System Settings** | Blood type thresholds and system configuration |

### Patient Portal
| Feature | Description |
|---|---|
| **Dashboard** | Personal stats — submitted requests and donation applications |
| **Search Blood** | Check live blood type availability |
| **Request Blood** | Submit a blood request (hospital auto-suggest) |
| **Donate Blood** | Apply to donate; staff review and approve |
| **Other Blood Banks** | Submit inter-bank blood request to partner network |
| **Contact** | Contact form |

---

## 💾 Data Storage

All data is persisted in **localStorage** (no backend required):

| Key | Contents |
|---|---|
| `bb_users` | Registered user accounts |
| `bb_session` | Current logged-in session |
| `bb_user_submissions` | Patient blood requests & donation applications |
| `bb_external_requests` | Incoming inter-bank requests |
| `bb_outgoing_requests` | Outgoing inter-bank requests |

---

## 🔀 Routing

| Path | Access | View |
|---|---|---|
| `/login` | Public | Login |
| `/register` | Public | Register |
| `/admin-login` | Public | Admin Login |
| `/` | Staff | Dashboard |
| `/donors` | Staff | Donors |
| `/inventory` | Staff | Inventory |
| `/requests` | Staff | Blood Requests |
| `/external-requests` | Staff | Inter-Bank Requests |
| `/donation-applications` | Staff | Donation Applications |
| `/compatibility` | Staff | Compatibility Checker |
| `/admin` | Admin only | Admin Console |
| `/user-dashboard` | Patient | User Dashboard |
| `/search-blood` | Patient | Blood Search |
| `/request-blood` | Patient | Request Blood |
| `/donate-blood` | Patient | Donate Blood |
| `/external-bank-request` | Patient | Other Blood Banks |
| `/contact` | Patient | Contact |

---

## 🧱 Layout Architecture

Both portals use a **CSS Grid shell** component pattern:

```
┌─────────────────────────────────┐
│           Top Bar               │  ← brand + profile + logout
├──────────┬──────────────────────┤
│          │                      │
│ Sidebar  │    Page Content      │  ← <slot /> from RouterView
│  (nav)   │                      │
│          │                      │
└──────────┴──────────────────────┘
```

- Sidebar is **collapsible** (hamburger toggle)
- Active route highlighted with red right-border accent
- Sidebar badge shows pending counts (critical stock, inter-bank, donation applications)
