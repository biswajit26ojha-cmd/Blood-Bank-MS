<template>
  <div class="user-shell" :class="{ collapsed: sidebarCollapsed }">

    <!-- ── Top Bar ─────────────────────────────────────────────────────── -->
    <header class="topbar">
      <button class="hamburger" @click="sidebarCollapsed = !sidebarCollapsed" :title="sidebarCollapsed ? 'Expand menu' : 'Collapse menu'">
        <span></span><span></span><span></span>
      </button>
      <div class="brand">
        <span class="brand-icon">🩸</span>
        <span class="brand-text">BloodBank<strong>MS</strong></span>
      </div>
      <div class="topbar-right">
        <div class="user-menu">
          <span class="user-avatar">{{ userInitials }}</span>
          <div class="user-info">
            <span class="user-name">{{ auth.currentUser?.name }}</span>
            <span class="user-role">Patient</span>
          </div>
          <button class="logout-btn" @click="handleLogout" title="Sign out">⏻ Logout</button>
        </div>
      </div>
    </header>

    <!-- ── Sidebar ─────────────────────────────────────────────────────── -->
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
        </RouterLink>
      </nav>
    </aside>

    <!-- ── Page content slot ───────────────────────────────────────────── -->
    <div class="page-area">
      <slot />
    </div>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()

const sidebarCollapsed = ref(false)

const navLinks = [
  { to: '/user-dashboard',       icon: '🏠', label: 'Home' },
  { to: '/search-blood',         icon: '🔍', label: 'Search Blood' },
  { to: '/request-blood',        icon: '🩸', label: 'Request Blood' },
  { to: '/external-bank-request',icon: '🏥', label: 'Other Blood Banks' },
  { to: '/donate-blood',         icon: '💉', label: 'Donate' },
  { to: '/contact',              icon: '✉️', label: 'Contact' },
]

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
.user-shell {
  display: grid;
  grid-template-rows: 60px 1fr;
  grid-template-columns: 220px 1fr;
  grid-template-areas:
    "topbar topbar"
    "sidebar main";
  min-height: 100vh;
  transition: grid-template-columns 0.25s ease;
}

.user-shell.collapsed {
  grid-template-columns: 60px 1fr;
}

/* ── Top bar ─────────────────────────────────────────────────────────────── */
.topbar {
  grid-area: topbar;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: linear-gradient(135deg, #1a1a2e, #16213e);
  padding: 0 1.5rem;
  height: 60px;
  box-shadow: 0 2px 8px rgba(0,0,0,.3);
  position: sticky;
  top: 0;
  z-index: 200;
}

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
  background: rgba(255,255,255,0.7);
  border-radius: 2px;
  transition: background 0.2s;
}

.hamburger:hover span { background: #fff; }

.brand {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #fff;
  font-size: 1.2rem;
  white-space: nowrap;
}

.brand-icon { font-size: 1.4rem; }
.brand-text strong { color: #e74c3c; font-weight: 800; }

.topbar-right {
  margin-left: auto;
  display: flex;
  align-items: center;
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
  border-right: 3px solid transparent;
}

.nav-item:hover {
  background: rgba(231,76,60,0.12);
  color: #fff;
}

.nav-item.active {
  background: rgba(231,76,60,0.25);
  color: #fff;
  border-right-color: #e74c3c;
}

.nav-icon { font-size: 1.1rem; flex-shrink: 0; }

.nav-label {
  flex: 1;
  transition: opacity 0.2s;
}

.user-shell.collapsed .nav-label {
  opacity: 0;
  pointer-events: none;
}

/* ── Page area ───────────────────────────────────────────────────────────── */
.page-area {
  grid-area: main;
  min-width: 0;
  overflow-x: hidden;
}

/* ── User menu (topbar right) ────────────────────────────────────────────── */
.user-menu {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255,255,255,.07);
  border-radius: 8px;
  padding: 0.3rem 0.75rem;
}

.user-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: linear-gradient(135deg, #e74c3c, #c0392b);
  color: #fff;
  font-size: 0.72rem;
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
  font-weight: 500;
  max-width: 130px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.2;
}

.user-role {
  color: rgba(255,255,255,.55);
  font-size: 0.72rem;
  line-height: 1.2;
}

.logout-btn {
  background: rgba(255,255,255,.12);
  color: rgba(255,255,255,.85);
  border: none;
  border-radius: 5px;
  padding: 0.3rem 0.65rem;
  font-size: 0.8rem;
  cursor: pointer;
  transition: background .2s;
  white-space: nowrap;
}

.logout-btn:hover { background: rgba(255,255,255,.25); }

/* ── Responsive ──────────────────────────────────────────────────────────── */
@media (max-width: 640px) {
  .user-info { display: none; }
  .brand-text { display: none; }
}
</style>
