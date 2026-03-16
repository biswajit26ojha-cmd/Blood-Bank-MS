import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '@/services/api'

const TOKEN_KEY = 'bb_token'
const SESSION_KEY = 'bb_session'

export const useAuthStore = defineStore('auth', () => {
  // List of users visible to admin — populated by fetchUsers()
  const users = ref([])

  // Rehydrate session from localStorage on page load
  const currentUser = ref(JSON.parse(localStorage.getItem(SESSION_KEY)) || null)

  const isLoggedIn = computed(() => currentUser.value !== null)
  const isAdmin    = computed(() => currentUser.value?.role === 'admin')
  const isUser     = computed(() => currentUser.value?.role === 'user')
  const isStaff    = computed(() => ['staff', 'doctor', 'nurse', 'admin'].includes(currentUser.value?.role))

  function _setSession(token, user) {
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(SESSION_KEY, JSON.stringify(user))
    currentUser.value = user
  }

  // ── Auth actions ──────────────────────────────────────────────────────────

  async function register({ name, email, password }) {
    try {
      await api.register(name, email, password)
      return { ok: true }
    } catch (err) {
      return { ok: false, error: err.message }
    }
  }

  async function login(email, password) {
    try {
      const { token, user } = await api.login(email, password)
      if (user.role === 'admin') {
        return { ok: false, error: 'Please use the Admin Portal to sign in as administrator.' }
      }
      _setSession(token, user)
      return { ok: true }
    } catch (err) {
      return { ok: false, error: err.message }
    }
  }

  async function adminLogin(email, password) {
    try {
      const { token, user } = await api.adminLogin(email, password)
      _setSession(token, user)
      return { ok: true }
    } catch (err) {
      return { ok: false, error: err.message }
    }
  }

  function logout() {
    currentUser.value = null
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(SESSION_KEY)
  }

  // Validate the stored token and refresh the user object on page load
  async function restoreSession() {
    if (!localStorage.getItem(TOKEN_KEY)) return
    try {
      const { user } = await api.me()
      currentUser.value = user
      localStorage.setItem(SESSION_KEY, JSON.stringify(user))
    } catch {
      logout()
    }
  }

  // ── Admin user-management actions (all async) ─────────────────────────────

  async function fetchUsers() {
    try {
      const { users: list } = await api.getUsers()
      users.value = list
    } catch (err) {
      console.error('fetchUsers:', err.message)
    }
  }

  async function updateUserRole(userId, newRole) {
    try {
      await api.updateRole(userId, newRole)
      const idx = users.value.findIndex(u => u.id === userId)
      if (idx !== -1) users.value[idx] = { ...users.value[idx], role: newRole }
      if (currentUser.value?.id === userId) {
        currentUser.value = { ...currentUser.value, role: newRole }
        localStorage.setItem(SESSION_KEY, JSON.stringify(currentUser.value))
      }
      return { ok: true }
    } catch (err) {
      return { ok: false, error: err.message }
    }
  }

  async function deleteUser(userId) {
    if (currentUser.value?.id === userId)
      return { ok: false, error: 'You cannot delete your own account.' }
    try {
      await api.deleteUser(userId)
      users.value = users.value.filter(u => u.id !== userId)
      return { ok: true }
    } catch (err) {
      return { ok: false, error: err.message }
    }
  }

  async function resetPassword(userId, newPassword) {
    if (newPassword.length < 6)
      return { ok: false, error: 'Password must be at least 6 characters.' }
    try {
      await api.resetPassword(userId, newPassword)
      return { ok: true }
    } catch (err) {
      return { ok: false, error: err.message }
    }
  }

  async function register_admin({ name, email, password, role }) {
    try {
      // Register via auth endpoint then immediately update role if not 'user'
      await api.register(name, email, password)
      // Refresh user list so we can find the new user's id
      await fetchUsers()
      if (role && role !== 'user') {
        const newUser = users.value.find(u => u.email === email.toLowerCase())
        if (newUser) await api.updateRole(newUser.id, role)
        await fetchUsers()
      }
      return { ok: true }
    } catch (err) {
      return { ok: false, error: err.message }
    }
  }

  return {
    users, currentUser,
    isLoggedIn, isAdmin, isUser, isStaff,
    register, login, adminLogin, logout, restoreSession,
    fetchUsers, updateUserRole, deleteUser, resetPassword,
    register_admin,
  }
})
