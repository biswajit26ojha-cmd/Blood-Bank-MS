import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const USERS_KEY = 'bb_users'
const SESSION_KEY = 'bb_session'

const DEFAULT_ADMIN = {
  id: 'default-admin',
  name: 'Pankaj Mahanta',
  email: 'pankaj.mahanta@gmail.com',
  password: 'Admin@123',
  role: 'admin',
  createdAt: '2026-01-01T00:00:00.000Z'
}

function loadUsers() {
  try {
    const stored = JSON.parse(localStorage.getItem(USERS_KEY)) || []
    // Always ensure the default admin exists
    const hasAdmin = stored.find(u => u.id === DEFAULT_ADMIN.id)
    if (!hasAdmin) {
      stored.unshift(DEFAULT_ADMIN)
      localStorage.setItem(USERS_KEY, JSON.stringify(stored))
    }
    return stored
  } catch {
    const initial = [DEFAULT_ADMIN]
    localStorage.setItem(USERS_KEY, JSON.stringify(initial))
    return initial
  }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

export const useAuthStore = defineStore('auth', () => {
  const users = ref(loadUsers())
  const currentUser = ref(JSON.parse(localStorage.getItem(SESSION_KEY)) || null)

  const isLoggedIn = computed(() => currentUser.value !== null)

  function register({ name, email, password, role }) {
    if (users.value.find(u => u.email.toLowerCase() === email.toLowerCase())) {
      return { ok: false, error: 'An account with this email already exists.' }
    }
    const newUser = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2),
      name,
      email: email.toLowerCase(),
      password, // stored plaintext — acceptable for a local-only demo app
      role: role || 'staff',
      createdAt: new Date().toISOString()
    }
    users.value.push(newUser)
    saveUsers(users.value)
    return { ok: true }
  }

  // Staff/user login — rejects admin accounts
  function login(email, password) {
    const user = users.value.find(
      u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    )
    if (!user) {
      return { ok: false, error: 'Invalid email or password.' }
    }
    if (user.role === 'admin') {
      return { ok: false, error: 'Please use the Admin Portal to sign in as administrator.' }
    }
    const session = { id: user.id, name: user.name, email: user.email, role: user.role }
    currentUser.value = session
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    return { ok: true }
  }

  // Admin-only login
  function adminLogin(email, password) {
    const user = users.value.find(
      u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    )
    if (!user) {
      return { ok: false, error: 'Invalid admin credentials.' }
    }
    if (user.role !== 'admin') {
      return { ok: false, error: 'Access denied. Admin credentials required.' }
    }
    const session = { id: user.id, name: user.name, email: user.email, role: user.role }
    currentUser.value = session
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    return { ok: true }
  }

  function logout() {
    currentUser.value = null
    localStorage.removeItem(SESSION_KEY)
  }

  // ── Admin actions ───────────────────────────────────────────────────────
  const isAdmin = computed(() => currentUser.value?.role === 'admin')
  const isUser  = computed(() => currentUser.value?.role === 'user')
  const isStaff = computed(() => ['staff', 'doctor', 'nurse', 'admin'].includes(currentUser.value?.role))

  function updateUserRole(userId, newRole) {
    const idx = users.value.findIndex(u => u.id === userId)
    if (idx === -1) return { ok: false, error: 'User not found.' }
    users.value[idx] = { ...users.value[idx], role: newRole }
    saveUsers(users.value)
    // Keep session in sync if the updated user is the current user
    if (currentUser.value?.id === userId) {
      const session = { ...currentUser.value, role: newRole }
      currentUser.value = session
      localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    }
    return { ok: true }
  }

  function deleteUser(userId) {
    if (currentUser.value?.id === userId) {
      return { ok: false, error: 'You cannot delete your own account.' }
    }
    const exists = users.value.find(u => u.id === userId)
    if (!exists) return { ok: false, error: 'User not found.' }
    users.value = users.value.filter(u => u.id !== userId)
    saveUsers(users.value)
    return { ok: true }
  }

  function resetPassword(userId, newPassword) {
    if (newPassword.length < 6) return { ok: false, error: 'Password must be at least 6 characters.' }
    const idx = users.value.findIndex(u => u.id === userId)
    if (idx === -1) return { ok: false, error: 'User not found.' }
    users.value[idx] = { ...users.value[idx], password: newPassword }
    saveUsers(users.value)
    return { ok: true }
  }

  return { users, currentUser, isLoggedIn, isAdmin, isUser, isStaff, register, login, adminLogin, logout, updateUserRole, deleteUser, resetPassword }
})
