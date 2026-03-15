<template>
  <div class="auth-page">
    <div class="auth-card">
      <div class="auth-header">
        <span class="auth-logo">🩸</span>
        <h1>BloodBank<strong>MS</strong></h1>
        <p class="auth-subtitle">Sign in to your account</p>
      </div>

      <form @submit.prevent="handleLogin" novalidate>
        <div class="form-group">
          <label for="email">Email address</label>
          <input
            id="email"
            v-model.trim="form.email"
            type="email"
            placeholder="you@example.com"
            autocomplete="email"
            required
          />
        </div>

        <div class="form-group">
          <label for="password">Password</label>
          <div class="password-wrapper">
            <input
              id="password"
              v-model="form.password"
              :type="showPwd ? 'text' : 'password'"
              placeholder="••••••••"
              autocomplete="current-password"
              required
            />
            <button type="button" class="toggle-pwd" @click="showPwd = !showPwd" tabindex="-1">
              {{ showPwd ? '🙈' : '👁' }}
            </button>
          </div>
        </div>

        <p v-if="error" class="error-msg">{{ error }}</p>

        <button type="submit" class="btn-primary" :disabled="loading">
          {{ loading ? 'Signing in…' : 'Sign In' }}
        </button>
      </form>

      <p class="auth-footer">
        Don't have an account?
        <RouterLink to="/register">Create one</RouterLink>
      </p>
      <p class="admin-portal-link">
        <RouterLink to="/admin-login">🛡 Admin Portal</RouterLink>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()

const form = reactive({ email: '', password: '' })
const error = ref('')
const loading = ref(false)
const showPwd = ref(false)

async function handleLogin() {
  error.value = ''
  if (!form.email || !form.password) {
    error.value = 'Please fill in all fields.'
    return
  }
  loading.value = true
  // Simulate brief async delay for UX
  await new Promise(r => setTimeout(r, 300))
  const result = auth.login(form.email, form.password)
  loading.value = false
  if (result.ok) {
    router.push(auth.currentUser?.role === 'user' ? '/user-dashboard' : '/')
  } else {
    error.value = result.error
  }
}
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #c0392b 0%, #922b21 50%, #1a1a2e 100%);
  padding: 1rem;
}

.auth-card {
  background: #fff;
  border-radius: 16px;
  padding: 2.5rem 2rem;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.auth-header {
  text-align: center;
  margin-bottom: 2rem;
}

.auth-logo {
  font-size: 3rem;
  display: block;
  margin-bottom: 0.5rem;
}

.auth-header h1 {
  margin: 0 0 0.25rem;
  font-size: 1.75rem;
  color: #2c3e50;
}

.auth-header h1 strong {
  color: #c0392b;
}

.auth-subtitle {
  margin: 0;
  color: #7f8c8d;
  font-size: 0.9rem;
}

.form-group {
  margin-bottom: 1.25rem;
}

label {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 0.4rem;
}

input {
  width: 100%;
  padding: 0.65rem 0.85rem;
  border: 1.5px solid #dce1e7;
  border-radius: 8px;
  font-size: 0.95rem;
  color: #2c3e50;
  outline: none;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

input:focus {
  border-color: #c0392b;
  box-shadow: 0 0 0 3px rgba(192, 57, 43, 0.12);
}

.password-wrapper {
  position: relative;
}

.password-wrapper input {
  padding-right: 2.8rem;
}

.toggle-pwd {
  position: absolute;
  right: 0.6rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  padding: 0;
  line-height: 1;
}

.error-msg {
  color: #c0392b;
  font-size: 0.85rem;
  margin: -0.5rem 0 1rem;
  background: #fdecea;
  border-radius: 6px;
  padding: 0.5rem 0.75rem;
}

.btn-primary {
  width: 100%;
  padding: 0.75rem;
  background: linear-gradient(135deg, #c0392b, #922b21);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.1s;
  margin-top: 0.25rem;
}

.btn-primary:hover:not(:disabled) {
  opacity: 0.9;
}

.btn-primary:active:not(:disabled) {
  transform: scale(0.98);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.auth-footer {
  text-align: center;
  margin: 1.5rem 0 0;
  font-size: 0.9rem;
  color: #7f8c8d;
}

.auth-footer a {
  color: #c0392b;
  font-weight: 600;
  text-decoration: none;
}

.auth-footer a:hover {
  text-decoration: underline;
}

.admin-portal-link {
  text-align: center;
  margin: 0.6rem 0 0;
  font-size: 0.82rem;
}

.admin-portal-link a {
  color: #95a5a6;
  text-decoration: none;
  transition: color 0.2s;
}

.admin-portal-link a:hover {
  color: #c0392b;
  text-decoration: underline;
}
</style>
