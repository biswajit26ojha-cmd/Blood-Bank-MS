<template>
  <div id="app-root">
    <template v-if="auth.isLoggedIn && auth.isUser">
      <UserNavbar>
        <main class="main-content">
          <RouterView />
        </main>
      </UserNavbar>
    </template>
    <template v-else-if="auth.isLoggedIn">
      <Navbar>
        <main class="main-content">
          <RouterView />
        </main>
      </Navbar>
    </template>
    <template v-else>
      <main class="main-content">
        <RouterView />
      </main>
    </template>
  </div>
</template>

<script setup>
import Navbar from '@/components/Navbar.vue'
import UserNavbar from '@/components/UserNavbar.vue'
import { RouterView } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
</script>

<style>
*, *::before, *::after { box-sizing: border-box; }

body {
  margin: 0;
  font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
  background: #f4f6f9;
  color: #2c3e50;
  min-height: 100vh;
}

#app-root {
  min-height: 100vh;
}

.main-content {
  flex: 1;
}

/* Scrollbar */
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: #f1f1f1; }
::-webkit-scrollbar-thumb { background: #c0392b; border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: #a93226; }
</style>
