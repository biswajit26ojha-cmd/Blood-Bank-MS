# 🩸 Blood Bank Management System

A full-featured Blood Bank Management System built with **Vue 3**, **Pinia**, and **Vue Router 4**. Supports multiple user roles with dedicated portals for patients, staff, and administrators.

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
