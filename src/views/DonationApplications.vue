<template>
  <div class="da-page">
    <div class="page-header">
      <div>
        <h1>💉 Donation Applications</h1>
        <p class="page-sub">Review blood donation applications submitted by registered users</p>
      </div>
    </div>

    <!-- Stats -->
    <div class="stat-bar">
      <div class="stat-card" v-for="s in stats" :key="s.label">
        <span class="stat-count" :class="s.color">{{ s.count }}</span>
        <span class="stat-label">{{ s.label }}</span>
      </div>
    </div>

    <!-- Toolbar -->
    <div class="toolbar">
      <div class="filter-tabs">
        <button
          v-for="f in filters"
          :key="f"
          :class="['ftab', { active: activeFilter === f }]"
          @click="activeFilter = f"
        >{{ f }}</button>
      </div>
      <div class="toolbar-right">
        <select v-model="typeFilter" class="type-select">
          <option value="">All Blood Types</option>
          <option v-for="t in store.BLOOD_TYPES" :key="t" :value="t">{{ t }}</option>
        </select>
        <input v-model="search" class="search-input" placeholder="🔍  Search name, city, email…" />
      </div>
    </div>

    <!-- Table -->
    <div class="table-card">
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Applicant</th>
              <th>Blood Type</th>
              <th>Age</th>
              <th>Contact</th>
              <th>City</th>
              <th>Last Donation</th>
              <th>Applied</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="filtered.length === 0">
              <td colspan="9" class="empty">No donation applications found.</td>
            </tr>
            <tr v-for="app in filtered" :key="app.id">
              <td>
                <div class="name-cell">
                  <strong>{{ app.name }}</strong>
                  <span class="user-label">👤 {{ app.userName }}</span>
                </div>
              </td>
              <td><span class="bt-badge">{{ app.bloodType }}</span></td>
              <td>{{ app.age }}</td>
              <td>
                <div class="contact-cell">
                  <a :href="'tel:' + app.phone" class="contact-link">{{ app.phone }}</a>
                  <a :href="'mailto:' + app.email" class="contact-link">{{ app.email }}</a>
                </div>
              </td>
              <td>{{ app.city }}</td>
              <td class="date-cell">{{ app.lastDonation || '—' }}</td>
              <td class="date-cell">{{ fmtDate(app.createdAt) }}</td>
              <td>
                <span :class="['status-chip', statusClass(app.status)]">{{ app.status }}</span>
              </td>
              <td>
                <div class="action-btns" v-if="app.status === 'Pending Review'">
                  <button class="btn-approve" @click="openConfirm(app, 'Approved')">✅ Approve</button>
                  <button class="btn-reject"  @click="openConfirm(app, 'Rejected')">✕ Reject</button>
                </div>
                <span v-else class="action-done">—</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Confirm Modal -->
    <div v-if="modal.show" class="modal-overlay" @click.self="modal.show = false">
      <div class="modal">
        <h2>{{ modal.action === 'Approved' ? '✅ Approve Application' : '✕ Reject Application' }}</h2>
        <p class="modal-desc" v-if="modal.app">
          {{ modal.action === 'Approved'
            ? `Approve ${modal.app.name}'s application and add them as a registered donor (${modal.app.bloodType})?`
            : `Reject the donation application from ${modal.app.name}?`
          }}
        </p>
        <div class="modal-actions">
          <button class="btn-secondary" @click="modal.show = false">Cancel</button>
          <button
            :class="modal.action === 'Approved' ? 'btn-approve-lg' : 'btn-reject-lg'"
            @click="submitReview"
          >Confirm {{ modal.action }}</button>
        </div>
      </div>
    </div>

    <!-- Toast -->
    <transition name="toast">
      <div v-if="toast" class="toast">{{ toast }}</div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'
import { useBloodBankStore } from '@/stores/bloodBank'

const store = useBloodBankStore()

const filters = ['All', 'Pending Review', 'Approved', 'Rejected']
const activeFilter = ref('All')
const typeFilter = ref('')
const search = ref('')
const toast = ref('')

const applications = computed(() =>
  store.userSubmissions.filter(s => s.type === 'donate')
)

const stats = computed(() => [
  { label: 'Total',          count: applications.value.length,                                                  color: '' },
  { label: 'Pending Review', count: applications.value.filter(a => a.status === 'Pending Review').length,      color: 'orange' },
  { label: 'Approved',       count: applications.value.filter(a => a.status === 'Approved').length,            color: 'green' },
  { label: 'Rejected',       count: applications.value.filter(a => a.status === 'Rejected').length,            color: 'red' },
])

const filtered = computed(() => {
  const q = search.value.toLowerCase()
  return applications.value.filter(a => {
    if (activeFilter.value !== 'All' && a.status !== activeFilter.value) return false
    if (typeFilter.value && a.bloodType !== typeFilter.value) return false
    if (q && !a.name.toLowerCase().includes(q) && !a.city.toLowerCase().includes(q) && !a.email.toLowerCase().includes(q)) return false
    return true
  })
})

const modal = reactive({ show: false, app: null, action: '' })

function openConfirm(app, action) {
  modal.app = app
  modal.action = action
  modal.show = true
}

function submitReview() {
  store.reviewDonationApplication(modal.app.id, modal.action)
  const msg = modal.action === 'Approved'
    ? `✅ ${modal.app.name} approved and added as a donor.`
    : `Application from ${modal.app.name} rejected.`
  toast.value = msg
  setTimeout(() => (toast.value = ''), 3500)
  modal.show = false
}

function statusClass(s) {
  return { 'Pending Review': 'pending', Approved: 'approved', Rejected: 'rejected' }[s] || 'pending'
}

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
</script>

<style scoped>
.da-page { max-width: 1200px; margin: 0 auto; padding: 2rem 1.5rem; }

.page-header { margin-bottom: 1.5rem; }
.page-header h1 { margin: 0 0 0.25rem; font-size: 1.75rem; color: #2c3e50; }
.page-sub { margin: 0; font-size: 0.9rem; color: #7f8c8d; }

/* Stats */
.stat-bar { display: flex; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
.stat-card {
  flex: 1; min-width: 110px; background: #fff; border-radius: 10px;
  padding: 1rem 1.25rem; box-shadow: 0 1px 6px rgba(0,0,0,.07);
  display: flex; flex-direction: column; gap: 0.2rem;
}
.stat-count { font-size: 1.75rem; font-weight: 700; color: #2c3e50; line-height: 1; }
.stat-count.orange { color: #e67e22; }
.stat-count.green  { color: #27ae60; }
.stat-count.red    { color: #c0392b; }
.stat-label { font-size: 0.78rem; color: #7f8c8d; }

/* Toolbar */
.toolbar {
  display: flex; align-items: center; justify-content: space-between;
  flex-wrap: wrap; gap: 0.75rem; margin-bottom: 1rem;
}
.filter-tabs { display: flex; gap: 0.4rem; flex-wrap: wrap; }
.ftab {
  padding: 0.45rem 1rem; border: 1.5px solid #dce1e7; border-radius: 8px;
  background: #fff; font-size: 0.85rem; cursor: pointer; color: #555; transition: all .15s;
}
.ftab:hover { border-color: #1a1a2e; color: #1a1a2e; }
.ftab.active { background: #1a1a2e; border-color: #1a1a2e; color: #fff; font-weight: 600; }
.toolbar-right { display: flex; gap: 0.6rem; flex-wrap: wrap; }
.type-select, .search-input {
  padding: 0.5rem 0.85rem; border: 1.5px solid #dce1e7; border-radius: 8px;
  font-size: 0.88rem; outline: none; color: #2c3e50; background: #fff; transition: border-color .2s;
}
.type-select:focus, .search-input:focus { border-color: #1a1a2e; }
.search-input { min-width: 240px; }

/* Table */
.table-card { background: #fff; border-radius: 14px; box-shadow: 0 2px 10px rgba(0,0,0,.08); overflow: hidden; }
.table-wrap { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; font-size: 0.88rem; }
thead th {
  background: #f8f9fb; padding: 0.75rem 1rem; text-align: left;
  font-weight: 600; color: #555; border-bottom: 1px solid #eef0f4; white-space: nowrap;
}
tbody td { padding: 0.85rem 1rem; border-bottom: 1px solid #f4f5f8; color: #2c3e50; vertical-align: middle; }
tbody tr:last-child td { border-bottom: none; }
tbody tr:hover td { background: #f8f9fb; }
.empty { text-align: center; color: #aaa; padding: 3rem; }

.name-cell { display: flex; flex-direction: column; gap: 0.15rem; }
.user-label { font-size: 0.75rem; color: #95a5a6; }

.bt-badge {
  display: inline-block; background: #1a1a2e; color: #fff;
  border-radius: 6px; padding: 0.2rem 0.6rem; font-size: 0.8rem; font-weight: 800;
}

.contact-cell { display: flex; flex-direction: column; gap: 0.15rem; font-size: 0.8rem; }
.contact-link { color: #2980b9; text-decoration: none; font-size: 0.76rem; }
.contact-link:hover { text-decoration: underline; }

.date-cell { font-size: 0.78rem; color: #95a5a6; }

.status-chip {
  padding: 0.2rem 0.65rem; border-radius: 99px;
  font-size: 0.72rem; font-weight: 700; white-space: nowrap;
}
.status-chip.pending  { background: #fef9e7; color: #d68910; }
.status-chip.approved { background: #eafaf1; color: #1e8449; }
.status-chip.rejected { background: #fdecea; color: #c0392b; }

.action-btns { display: flex; gap: 0.4rem; flex-wrap: nowrap; white-space: nowrap; }
.action-done { color: #bdc3c7; font-size: 0.85rem; }
thead th:last-child, tbody td:last-child { white-space: nowrap; min-width: 150px; }

.btn-approve {
  padding: 0.35rem 0.75rem; background: #eafaf1; color: #1e8449;
  border: 1.5px solid #a9dfbf; border-radius: 7px; font-size: 0.78rem;
  font-weight: 600; cursor: pointer; white-space: nowrap; transition: background .15s;
}
.btn-approve:hover { background: #a9dfbf; }

.btn-reject {
  padding: 0.35rem 0.75rem; background: #fdecea; color: #c0392b;
  border: 1.5px solid #f5b7b1; border-radius: 7px; font-size: 0.78rem;
  font-weight: 600; cursor: pointer; white-space: nowrap; transition: background .15s;
}
.btn-reject:hover { background: #f5b7b1; }

/* Modal */
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,.45);
  display: flex; align-items: center; justify-content: center; z-index: 500; padding: 1rem;
}
.modal {
  background: #fff; border-radius: 14px; padding: 2rem;
  width: 100%; max-width: 420px; box-shadow: 0 16px 48px rgba(0,0,0,.25);
}
.modal h2 { margin: 0 0 0.75rem; font-size: 1.2rem; color: #2c3e50; }
.modal-desc { margin: 0 0 1.25rem; font-size: 0.9rem; color: #555; line-height: 1.6; }
.modal-actions { display: flex; justify-content: flex-end; gap: 0.75rem; }

.btn-secondary {
  padding: 0.6rem 1.2rem; background: #f4f5f8; color: #555;
  border: 1.5px solid #dce1e7; border-radius: 8px; font-size: 0.9rem; cursor: pointer;
}
.btn-secondary:hover { background: #eaecf0; }

.btn-approve-lg {
  padding: 0.6rem 1.4rem; background: #27ae60; color: #fff;
  border: none; border-radius: 8px; font-size: 0.9rem; font-weight: 600; cursor: pointer;
}
.btn-approve-lg:hover { background: #1e8449; }

.btn-reject-lg {
  padding: 0.6rem 1.4rem; background: #c0392b; color: #fff;
  border: none; border-radius: 8px; font-size: 0.9rem; font-weight: 600; cursor: pointer;
}
.btn-reject-lg:hover { background: #a93226; }

/* Toast */
.toast {
  position: fixed; bottom: 1.75rem; left: 50%; transform: translateX(-50%);
  background: #2c3e50; color: #fff; padding: 0.7rem 1.5rem;
  border-radius: 24px; font-size: 0.9rem; box-shadow: 0 4px 16px rgba(0,0,0,.25);
  z-index: 600; white-space: nowrap;
}
.toast-enter-active, .toast-leave-active { transition: opacity .3s, transform .3s; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateX(-50%) translateY(10px); }
</style>
