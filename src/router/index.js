import { createRouter, createWebHashHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import Dashboard from '@/views/Dashboard.vue'
import Donors from '@/views/Donors.vue'
import Inventory from '@/views/Inventory.vue'
import Requests from '@/views/Requests.vue'
import Compatibility from '@/views/Compatibility.vue'
import Login from '@/views/Login.vue'
import Register from '@/views/Register.vue'
import Admin from '@/views/Admin.vue'
import AdminLogin from '@/views/AdminLogin.vue'
import UserDashboard from '@/views/user/UserDashboard.vue'
import BloodSearch from '@/views/user/BloodSearch.vue'
import RequestBlood from '@/views/user/RequestBlood.vue'
import DonateBlood from '@/views/user/DonateBlood.vue'
import Contact from '@/views/user/Contact.vue'
import ExternalBankRequest from '@/views/user/ExternalBankRequest.vue'
import ExternalRequests from '@/views/ExternalRequests.vue'
import DonationApplications from '@/views/DonationApplications.vue'

const routes = [
  // Public auth routes
  { path: '/login',       name: 'Login',      component: Login,      meta: { public: true } },
  { path: '/admin-login', name: 'AdminLogin', component: AdminLogin, meta: { adminPublic: true } },
  { path: '/register',    name: 'Register',   component: Register,   meta: { public: true } },

  // Staff / internal routes
  { path: '/',             name: 'Dashboard',    component: Dashboard,    meta: { requiresAuth: true, requiresStaff: true } },
  { path: '/donors',       name: 'Donors',       component: Donors,       meta: { requiresAuth: true, requiresStaff: true } },
  { path: '/inventory',    name: 'Inventory',    component: Inventory,    meta: { requiresAuth: true, requiresStaff: true } },
  { path: '/requests',     name: 'Requests',     component: Requests,     meta: { requiresAuth: true, requiresStaff: true } },
  { path: '/compatibility',name: 'Compatibility',component: Compatibility,meta: { requiresAuth: true, requiresStaff: true } },
  { path: '/admin',        name: 'Admin',        component: Admin,        meta: { requiresAuth: true, requiresAdmin: true } },

  // User (patient) routes
  { path: '/user-dashboard', name: 'UserDashboard', component: UserDashboard, meta: { requiresAuth: true, requiresUser: true } },
  { path: '/search-blood',   name: 'BloodSearch',   component: BloodSearch,   meta: { requiresAuth: true, requiresUser: true } },
  { path: '/request-blood',  name: 'RequestBlood',  component: RequestBlood,  meta: { requiresAuth: true, requiresUser: true } },
  { path: '/donate-blood',   name: 'DonateBlood',   component: DonateBlood,   meta: { requiresAuth: true, requiresUser: true } },
  { path: '/contact',        name: 'Contact',        component: Contact,       meta: { requiresAuth: true, requiresUser: true } },
  { path: '/external-bank-request', name: 'ExternalBankRequest', component: ExternalBankRequest, meta: { requiresAuth: true, requiresUser: true } },

  // Staff inter-bank route
  { path: '/external-requests',      name: 'ExternalRequests',      component: ExternalRequests,      meta: { requiresAuth: true, requiresStaff: true } },
  { path: '/donation-applications',  name: 'DonationApplications',  component: DonationApplications,  meta: { requiresAuth: true, requiresStaff: true } },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  const role = auth.currentUser?.role

  if (to.meta.requiresAuth && !auth.isLoggedIn) {
    return { name: 'Login' }
  }

  // Redirect logged-in users away from public auth pages
  if (to.meta.public && auth.isLoggedIn) {
    if (role === 'admin') return { name: 'Admin' }
    if (role === 'user')  return { name: 'UserDashboard' }
    return { name: 'Dashboard' }
  }

  if (to.meta.adminPublic && auth.isLoggedIn) {
    return role === 'admin' ? { name: 'Admin' } : { name: role === 'user' ? 'UserDashboard' : 'Dashboard' }
  }

  // Admin-only routes
  if (to.meta.requiresAdmin && role !== 'admin') {
    return role === 'user' ? { name: 'UserDashboard' } : { name: 'Dashboard' }
  }

  // Staff-only routes: block patient users
  if (to.meta.requiresStaff && role === 'user') {
    return { name: 'UserDashboard' }
  }

  // User-only routes: block staff/admin
  if (to.meta.requiresUser && role !== 'user') {
    return role === 'admin' ? { name: 'Admin' } : { name: 'Dashboard' }
  }
})

export default router
