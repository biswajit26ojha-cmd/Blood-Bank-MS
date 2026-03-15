<template>
  <div class="admin-auth-page">
    <div class="admin-auth-card">
      <div class="admin-auth-header">
        <span class="admin-logo">🛡</span>
        <h1>Admin Portal</h1>
        <p class="admin-subtitle">BloodBank<strong>MS</strong> — Restricted Access</p>
      </div>

      <div class="access-warning">
        ⚠ This portal is for authorised administrators only.
      </div>

      <form @submit.prevent="handleLogin" novalidate>
        <div class="form-group">
          <label for="admin-email">Admin Email</label>
          <input
            id="admin-email"
            v-model.trim="form.email"
            type="email"
            placeholder="admin@example.com"
            autocomplete="email"
            required
          />
        </div>

        <div class="form-group">
          <label for="admin-password">Password</label>
          <div class="password-wrapper">
            <input
              id="admin-password"
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

        <button type="submit" class="btn-admin" :disabled="loading">
          {{ loading ? 'Verifying…' : '🔐 Sign In as Admin' }}
        </button>
      </form>

      <p class="auth-footer">
        Not an admin?
        <RouterLink to="/login">Staff login →</RouterLink>
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
  await new Promise(r => setTimeout(r, 300))
  const result = auth.adminLogin(form.email, form.password)
  loading.value = false
  if (result.ok) {
    router.push('/admin')
  } else {
    error.value = result.error
  }
}
</script>

<style scoped>
.admin-auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  padding: 1rem;
}

.admin-auth-card {
  background: #1e2433;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 2.5rem 2rem;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
}

.admin-auth-header {
  text-align: center;
  margin-bottom: 1.5rem;
}

.admin-logo {
  font-size: 3rem;
  display: block;
  margin-bottom: 0.5rem;
}

.admin-auth-header h1 {
  margin: 0 0 0.25rem;
  font-size: 1.75rem;
  color: #fff;
  letter-spacing: 0.5px;
}

.admin-subtitle {
  margin: 0;
  color: rgba(255, 255, 255, 0.45);
  font-size: 0.88rem;
}

.admin-subtitle strong {
  color: #e74c3c;
}

.access-warning {
  background: rgba(231, 76, 60, 0.12);
  border: 1px solid rgba(231, 76, 60, 0.3);
  color: #e67e73;
  border-radius: 8px;
  padding: 0.6rem 0.9rem;
  font-size: 0.82rem;
  text-align: center;
  margin-bottom: 1.5rem;
}

.form-group {
  margin-bottom: 1.25rem;
}

label {
  display: block;
  font-size: 0.82rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.65);
  margin-bottom: 0.4rem;
  letter-spacing: 0.3px;
}

input {
  width: 100%;
  padding: 0.65rem 0.85rem;
  border: 1.5px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  font-size: 0.95rem;
  color: #fff;
  background: rgba(255, 255, 255, 0.06);
  outline: none;
  transition: border-color 0.2s, background 0.2s;
  box-sizing: border-box;
}

input::placeholder { color: rgba(255,255,255,.25); }

input:focus {
  border-color: #e74c3c;
  background: rgba(255, 255, 255, 0.09);
  box-shadow: 0 0 0 3px rgba(231, 76, 60, 0.15);
}

.password-wrapper { position: relative; }
.password-wrapper input { padding-right: 2.8rem; }

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
  color: #e67e73;
  font-size: 0.84rem;
  background: rgba(231, 76, 60, 0.12);
  border: 1px solid rgba(231, 76, 60, 0.25);
  border-radius: 6px;
  padding: 0.5rem 0.75rem;
  margin: -0.5rem 0 1rem;
}

.btn-admin {
  width: 100%;
  padding: 0.75rem;
  background: linear-gradient(135deg, #c0392b, #922b21);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  letter-spacing: 0.3px;
  transition: opacity 0.2s, transform 0.1s;
  margin-top: 0.25rem;
}

.btn-admin:hover:not(:disabled) { opacity: 0.88; }
.btn-admin:active:not(:disabled) { transform: scale(0.98); }
.btn-admin:disabled { opacity: 0.5; cursor: not-allowed; }

.auth-footer {
  text-align: center;
  margin: 1.5rem 0 0;
  font-size: 0.88rem;
  color: rgba(255, 255, 255, 0.35);
}

.auth-footer a {
  color: rgba(255, 255, 255, 0.6);
  font-weight: 600;
  text-decoration: none;
}

.auth-footer a:hover {
  color: #fff;
  text-decoration: underline;
}
</style>
