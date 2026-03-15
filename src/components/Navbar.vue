<template>
  <div class="staff-shell" :class="{ collapsed: sidebarCollapsed }">

    <!-- ── Top Bar ──────────────────────────────────────────────────── -->
    <header class="topbar">
      <button class="hamburger" @click="sidebarCollapsed = !sidebarCollapsed" :title="sidebarCollapsed ? 'Expand menu' : 'Collapse menu'">
        <span></span><span></span><span></span>
      </button>
      <div class="brand">
        <span class="brand-icon">🩸</span>
        <span class="brand-text">BloodBank<strong>MS</strong></span>
      </div>
      <div class="topbar-right">
        <span class="critical-badge" v-if="store.criticalStock.length">
          ⚠ {{ store.criticalStock.length }} Critical
        </span>
        <div class="user-menu">
          <span class="user-avatar">{{ userInitials }}</span>
          <div class="user-info">
            <span class="user-name">{{ auth.currentUser?.name }}</span>
            <span class="user-role">{{ auth.currentUser?.role }}</span>
          </div>
          <button class="logout-btn" @click="handleLogout" title="Sign out">⏻ Logout</button>
        </div>
      </div>
    </header>

    <!-- ── Sidebar ──────────────────────────────────────────────────── -->
    <aside class="sidebar">
      <nav class="sidebar-nav">
        <RouterLink
          v-for="link in navLinks"
          :key="link.to"
          :to="link.to"
          class="nav-item"
          :class="{ active: $route.path === link.to }"
        >
          <span class="nav-icon">{{ link.icon }}</span>
          <span class="nav-label">{{ link.label }}</span>
          <span v-if="link.badge" class="nav-badge">{{ link.badge }}</span>
        </RouterLink>
      </nav>
    </aside>

    <!-- ── Page content slot ────────────────────────────────────────── -->
    <div class="page-area">
      <slot />
    </div>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useBloodBankStore } from '@/stores/bloodBank'
import { useAuthStore } from '@/stores/auth'

const store = useBloodBankStore()
const auth = useAuthStore()
const router = useRouter()

const sidebarCollapsed = ref(false)

const navLinks = computed(() => [
  { to: '/', icon: '📊', label: 'Dashboard' },
  { to: '/donors', icon: '👤', label: 'Donors' },
  { to: '/inventory', icon: '🗃', label: 'Inventory' },
  { to: '/requests', icon: '📋', label: 'Requests' },
  { to: '/external-requests',     icon: '🏥', label: 'Inter-Bank',   badge: store.pendingExternalRequests || null },
  { to: '/donation-applications', icon: '💉', label: 'Donations',    badge: store.pendingDonationApplications || null },
  { to: '/compatibility',         icon: '🔬', label: 'Compatibility' },
  ...(auth.isAdmin ? [{ to: '/admin', icon: '🛡', label: 'Admin' }] : [])
])

const userInitials = computed(() => {
  const name = auth.currentUser?.name || ''
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
})

function handleLogout() {
  auth.logout()
  router.push('/login')
}
</script>

<style scoped>
/* ── Shell layout ────────────────────────────────────────────────────────── */
.staff-shell {
  display: grid;
  grid-template-rows: 60px 1fr;
  grid-template-columns: 220px 1fr;
  grid-template-areas:
    "topbar topbar"
    "sidebar main";
  min-height: 100vh;
  transition: grid-template-columns 0.25s ease;
}

.staff-shell.collapsed {
  grid-template-columns: 60px 1fr;
}

/* ── Top bar ─────────────────────────────────────────────────────────────── */
.topbar {
  grid-area: topbar;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: linear-gradient(135deg, #c0392b, #922b21);
  padding: 0 1.5rem;
  height: 60px;
  box-shadow: 0 2px 8px rgba(0,0,0,.25);
  position: sticky;
  top: 0;
  z-index: 200;
}

/* hamburger */
.hamburger {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.4rem;
  display: flex;
  flex-direction: column;
  gap: 5px;
  flex-shrink: 0;
}

.hamburger span {
  display: block;
  width: 20px;
  height: 2px;
  background: rgba(255,255,255,0.8);
  border-radius: 2px;
  transition: background 0.2s;
}

.hamburger:hover span { background: #fff; }

/* brand */
.brand {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #fff;
  font-size: 1.2rem;
  white-space: nowrap;
}

.brand-icon { font-size: 1.4rem; }
.brand-text strong { font-weight: 800; }

/* right side */
.topbar-right {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

/* ── Sidebar ─────────────────────────────────────────────────────────────── */
.sidebar {
  grid-area: sidebar;
  background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
  display: flex;
  flex-direction: column;
  position: sticky;
  top: 60px;
  height: calc(100vh - 60px);
  overflow-y: auto;
  overflow-x: hidden;
  transition: width 0.25s ease;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  padding: 0.75rem 0;
  gap: 0.1rem;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0.75rem 1.1rem;
  color: rgba(255,255,255,0.65);
  text-decoration: none;
  font-size: 0.88rem;
  transition: background 0.15s, color 0.15s;
  white-space: nowrap;
  overflow: hidden;
  position: relative;
  border-right: 3px solid transparent;
}

.nav-item:hover {
  background: rgba(255,255,255,0.08);
  color: #fff;
}

.nav-item.active {
  background: rgba(192,57,43,0.3);
  color: #fff;
  border-right-color: #c0392b;
}

.nav-icon { font-size: 1.1rem; flex-shrink: 0; }

.nav-label {
  flex: 1;
  transition: opacity 0.2s;
}

.staff-shell.collapsed .nav-label {
  opacity: 0;
  pointer-events: none;
}

.nav-badge {
  background: #f39c12;
  color: #fff;
  font-size: 0.65rem;
  font-weight: 700;
  border-radius: 99px;
  padding: 0.15rem 0.45rem;
  min-width: 18px;
  text-align: center;
  line-height: 1.4;
  flex-shrink: 0;
  transition: opacity 0.2s;
}

.staff-shell.collapsed .nav-badge {
  opacity: 0;
}

/* ── Page area ───────────────────────────────────────────────────────────── */
.page-area {
  grid-area: main;
  min-width: 0;
  overflow-x: auto;
}

/* ── Top bar right side ──────────────────────────────────────────────────── */
.user-menu {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255,255,255,.12);
  border-radius: 8px;
  padding: 0.3rem 0.75rem;
}

.user-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: rgba(255,255,255,.3);
  color: #fff;
  font-size: 0.75rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.user-info {
  display: flex;
  flex-direction: column;
}

.user-name {
  color: #fff;
  font-size: 0.85rem;
  font-weight: 600;
  max-width: 130px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.2;
}

.user-role {
  color: rgba(255,255,255,.65);
  font-size: 0.72rem;
  text-transform: capitalize;
  line-height: 1.2;
}

.logout-btn {
  background: rgba(255,255,255,.15);
  color: #fff;
  border: none;
  border-radius: 5px;
  padding: 0.3rem 0.65rem;
  font-size: 0.8rem;
  cursor: pointer;
  transition: background 0.2s;
  white-space: nowrap;
}

.logout-btn:hover { background: rgba(255,255,255,.3); }

.critical-badge {
  background: #f39c12;
  color: #fff;
  padding: 0.3rem 0.75rem;
  border-radius: 20px;
  font-size: 0.78rem;
  font-weight: 600;
  animation: pulse 2s infinite;
  white-space: nowrap;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

/* ── Responsive ──────────────────────────────────────────────────────────── */
@media (max-width: 640px) {
  .user-info { display: none; }
  .brand-text { display: none; }
}
</style>
