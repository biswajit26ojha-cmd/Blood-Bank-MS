<template>
  <div class="admin-page">

    <!-- Page heading -->
    <div class="page-header">
      <h1>🛡 Admin Console</h1>
      <p class="page-sub">Manage users, roles, inter-bank requests and system settings</p>
    </div>

    <!-- Tab bar -->
    <div class="tab-bar">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="tab-btn"
        :class="{ active: activeTab === tab.key }"
        @click="activeTab = tab.key"
      >
        {{ tab.icon }} {{ tab.label }}
        <span v-if="tab.badge" class="tab-badge">{{ tab.badge }}</span>
      </button>
    </div>

    <!-- Stats bar (users tab) -->
    <div class="stat-bar" v-if="activeTab === 'users'">
      <div class="stat-card" v-for="s in roleStats" :key="s.role">
        <span class="stat-count">{{ s.count }}</span>
        <span class="stat-label">{{ s.label }}</span>
      </div>
      <div class="stat-card total">
        <span class="stat-count">{{ auth.users.length }}</span>
        <span class="stat-label">Total Users</span>
      </div>
    </div>

    <!-- ── User Management Tab ─────────────────────────────────────────── -->
    <section v-if="activeTab === 'users'" class="panel">
      <div class="panel-toolbar">
        <input v-model="search" class="search-input" placeholder="🔍  Search users…" />
        <button class="btn-add" @click="openCreateModal">＋ Add User</button>
      </div>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="filteredUsers.length === 0">
              <td colspan="5" class="empty">No users found.</td>
            </tr>
            <tr v-for="u in filteredUsers" :key="u.id" :class="{ 'self-row': u.id === auth.currentUser?.id }">
              <td>
                <div class="user-cell">
                  <span class="avatar">{{ initials(u.name) }}</span>
                  <span>{{ u.name }}<span v-if="u.id === auth.currentUser?.id" class="you-badge">you</span></span>
                </div>
              </td>
              <td class="email-cell">{{ u.email }}</td>
              <td>
                <select
                  :value="u.role"
                  @change="changeRole(u.id, $event.target.value)"
                  class="role-select"
                  :class="u.role"
                >
                  <option v-for="r in ROLES" :key="r" :value="r">{{ r }}</option>
                </select>
              </td>
              <td class="date-cell">{{ formatDate(u.createdAt) }}</td>
              <td>
                <div class="action-btns">
                  <button class="btn-icon" title="Reset password" @click="openResetModal(u)">🔑</button>
                  <button
                    class="btn-icon danger"
                    title="Delete user"
                    @click="confirmDelete(u)"
                    :disabled="u.id === auth.currentUser?.id"
                  >🗑</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- ── Activity Log Tab ──────────────────────────────────────────── -->
    <section v-if="activeTab === 'activity'" class="panel">
      <div class="panel-toolbar">
        <span class="panel-title">System Activity</span>
        <button class="btn-danger-sm" @click="store.fetchActivity()">↻ Refresh</button>
      </div>
      <div class="log-list">
        <div v-if="store.activityLog.length === 0" class="empty" style="padding:2rem;text-align:center">No activity yet.</div>
        <div v-for="entry in store.activityLog" :key="entry.id" class="log-entry">
          <span class="log-icon">{{ logIcon(entry.type) }}</span>
          <div class="log-body">
            <p>{{ entry.message }}</p>
            <span class="log-time">{{ entry.created_at }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- ── System Settings Tab ───────────────────────────────────────── -->
    <section v-if="activeTab === 'settings'" class="panel settings-panel">
      <h3>System Information</h3>
      <dl class="info-grid">
        <dt>Application</dt><dd>BloodBank MS v1.0</dd>
        <dt>Current Date</dt><dd>{{ today }}</dd>
        <dt>Logged-in user</dt><dd>{{ auth.currentUser?.name }} ({{ auth.currentUser?.role }})</dd>
        <dt>Registered users</dt><dd>{{ auth.users.length }}</dd>
        <dt>Total donors</dt><dd>{{ store.totalDonors }}</dd>
        <dt>Total blood units</dt><dd>{{ store.totalUnits }}</dd>
        <dt>Critical blood types</dt><dd>{{ store.criticalStock.join(', ') || 'None' }}</dd>
        <dt>Pending requests</dt><dd>{{ store.pendingRequests }}</dd>
      </dl>

      <h3 style="margin-top:2rem">Danger Zone</h3>
      <div class="danger-zone">
        <div>
          <strong>Clear all registered users</strong>
          <p>Removes every account except the currently logged-in admin.</p>
        </div>
        <button class="btn-danger" @click="clearOtherUsers">Clear other users</button>
      </div>
    </section>

      <!-- ── Inter-Bank Requests Tab ──────────────────────────────────── -->
      <section v-if="activeTab === 'interbank'" class="panel ib-panel">
        <!-- Stats -->
        <div class="ib-stats">
          <div class="ib-stat" v-for="s in ibStats" :key="s.label">
            <span class="ib-stat-val" :class="s.color">{{ s.count }}</span>
            <span class="ib-stat-lbl">{{ s.label }}</span>
          </div>
          <button class="btn-add ib-new-btn" @click="showNewReqModal = true">＋ Submit New Request</button>
        </div>

        <!-- Toolbar -->
        <div class="ib-toolbar">
          <div class="filter-tabs">
            <button v-for="f in ibFilters" :key="f" :class="['ftab', { active: ibFilter === f }]" @click="ibFilter = f">{{ f }}</button>
          </div>
          <div class="ib-toolbar-right">
            <select v-model="ibTypeFilter" class="type-select">
              <option value="">All Blood Types</option>
              <option v-for="t in store.BLOOD_TYPES" :key="t" :value="t">{{ t }}</option>
            </select>
            <input v-model="ibSearch" class="search-input" placeholder="🔍  Search bank / contact…" />
          </div>
        </div>

        <!-- Table -->
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Blood Bank / Hospital</th>
                <th>Contact</th>
                <th>Blood Type</th>
                <th>Units</th>
                <th>Urgency</th>
                <th>Reason</th>
                <th>Requested</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="ibFiltered.length === 0">
                <td colspan="9" class="empty">No requests match your filters.</td>
              </tr>
              <tr v-for="r in ibFiltered" :key="r.id" :class="['req-row', r.urgency.toLowerCase()]">
                <td>
                  <div class="bank-cell">
                    <span class="bank-icon">🏥</span>
                    <strong>{{ r.bank_name }}</strong>
                  </div>
                </td>
                <td>
                  <div class="contact-cell">
                    <span>{{ r.contact_name }}</span>
                    <a :href="'tel:' + r.contact_phone" class="contact-link">{{ r.contact_phone }}</a>
                    <a :href="'mailto:' + r.contact_email" class="contact-link ellipsis">{{ r.contact_email }}</a>
                  </div>
                </td>
                <td><span class="bt-badge">{{ r.blood_type }}</span></td>
                <td class="units-cell">{{ r.units }}</td>
                <td><span :class="['urg-chip', urgClass(r.urgency)]">{{ r.urgency }}</span></td>
                <td class="reason-cell" :title="r.reason">{{ r.reason }}</td>
                <td class="date-cell">
                  <span>{{ r.request_date }}</span>
                  <span v-if="r.resolved_date" class="resolved-date">→ {{ r.resolved_date }}</span>
                </td>
                <td><span :class="['status-chip', statusClass(r.status)]">{{ r.status }}</span></td>
                <td>
                  <div class="action-btns" v-if="r.status === 'Pending'">
                    <button class="btn-approve" @click="openIbConfirm(r.id, 'Approved')">✅ Approve</button>
                    <button class="btn-decline" @click="openIbConfirm(r.id, 'Declined')">✕ Decline</button>
                  </div>
                  <span v-else class="action-done">—</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- ── Modals ─────────────────────────────────────────────────────── -->

      <!-- Create User Modal -->
      <div v-if="showCreateModal" class="modal-overlay" @click.self="showCreateModal = false">
        <div class="modal">
          <h2>Add New User</h2>
          <form @submit.prevent="submitCreate">
            <div class="form-group">
              <label>Full name</label>
              <input v-model.trim="newUser.name" type="text" placeholder="Jane Doe" required />
            </div>
            <div class="form-group">
              <label>Email</label>
              <input v-model.trim="newUser.email" type="email" placeholder="jane@example.com" required />
            </div>
            <div class="form-group">
              <label>Role</label>
              <select v-model="newUser.role">
                <option v-for="r in ROLES" :key="r" :value="r">{{ r }}</option>
              </select>
            </div>
            <div class="form-group">
              <label>Password</label>
              <input v-model="newUser.password" type="password" placeholder="Min 6 characters" required />
            </div>
            <p v-if="modalError" class="modal-error">{{ modalError }}</p>
            <div class="modal-actions">
              <button type="button" class="btn-secondary" @click="showCreateModal = false">Cancel</button>
              <button type="submit" class="btn-primary">Create User</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Reset Password Modal -->
      <div v-if="showResetModal" class="modal-overlay" @click.self="showResetModal = false">
        <div class="modal">
          <h2>Reset Password</h2>
          <p class="modal-desc">Setting new password for <strong>{{ resetTarget?.name }}</strong></p>
          <form @submit.prevent="submitReset">
            <div class="form-group">
              <label>New password</label>
              <input v-model="resetPwd" type="password" placeholder="Min 6 characters" required />
            </div>
            <p v-if="modalError" class="modal-error">{{ modalError }}</p>
            <div class="modal-actions">
              <button type="button" class="btn-secondary" @click="showResetModal = false">Cancel</button>
              <button type="submit" class="btn-primary">Save Password</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Delete Confirm Modal -->
      <div v-if="showDeleteModal" class="modal-overlay" @click.self="showDeleteModal = false">
        <div class="modal">
          <h2>Delete User</h2>
          <p class="modal-desc">Are you sure you want to permanently delete <strong>{{ deleteTarget?.name }}</strong>? This cannot be undone.</p>
          <p v-if="modalError" class="modal-error">{{ modalError }}</p>
          <div class="modal-actions">
            <button class="btn-secondary" @click="showDeleteModal = false">Cancel</button>
            <button class="btn-danger" @click="submitDelete">Delete</button>
          </div>
        </div>
      </div>

      <!-- Inter-Bank: Confirm Action Modal -->
      <div v-if="ibConfirm.show" class="modal-overlay" @click.self="ibConfirm.show = false">
        <div class="modal">
          <h2>{{ ibConfirm.action === 'Approved' ? '✅ Approve Request' : '✕ Decline Request' }}</h2>
          <p v-if="ibConfirm.req" class="modal-desc">
            {{ ibConfirm.action === 'Approved'
              ? `This will dispatch ${ibConfirm.req.units} units of ${ibConfirm.req.blood_type} to ${ibConfirm.req.bank_name} and deduct them from inventory.`
              : `Decline the request from ${ibConfirm.req.bank_name}?`
            }}
          </p>
          <div v-if="ibConfirm.action === 'Approved' && ibConfirm.req" class="inv-check">
            <span :class="['inv-status', ibInventoryOk(ibConfirm.req) ? 'ok' : 'warn']">
              {{ ibInventoryOk(ibConfirm.req)
                ? `✅ Sufficient: ${store.inventory.find(i => i.blood_type === ibConfirm.req.blood_type)?.units} units available`
                : `⚠ Low stock: only ${store.inventory.find(i => i.blood_type === ibConfirm.req.blood_type)?.units ?? 0} units (requesting ${ibConfirm.req.units})`
              }}
            </span>
          </div>
          <div class="modal-actions">
            <button class="btn-secondary" @click="ibConfirm.show = false">Cancel</button>
            <button :class="ibConfirm.action === 'Approved' ? 'btn-primary' : 'btn-danger'" @click="submitIbAction">
              Confirm {{ ibConfirm.action }}
            </button>
          </div>
        </div>
      </div>

      <!-- Inter-Bank: New Request Modal -->
      <div v-if="showNewReqModal" class="modal-overlay" @click.self="showNewReqModal = false">
        <div class="modal modal-lg">
          <h2>🏥 Submit Inter-Bank Blood Request</h2>
          <form @submit.prevent="submitNewReq">
            <div class="form-row">
              <div class="form-group">
                <label>Requesting Hospital / Bank *</label>
                <input v-model.trim="newReq.requestingBank" type="text" placeholder="City General Hospital" required list="bank-list" autocomplete="off" />
                <datalist id="bank-list">
                  <option v-for="b in store.allBanks" :key="b" :value="b" />
                </datalist>
              </div>
              <div class="form-group">
                <label>Contact Person *</label>
                <input v-model.trim="newReq.contactName" type="text" placeholder="Dr. Jane Smith" required />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Contact Phone *</label>
                <input v-model.trim="newReq.contactPhone" type="tel" placeholder="+1 555 000 0000" required />
              </div>
              <div class="form-group">
                <label>Contact Email *</label>
                <input v-model.trim="newReq.contactEmail" type="email" placeholder="contact@hospital.org" required />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Blood Type *</label>
                <select v-model="newReq.bloodType" required>
                  <option value="">Select blood type</option>
                  <option v-for="t in store.BLOOD_TYPES" :key="t" :value="t">{{ t }}</option>
                </select>
              </div>
              <div class="form-group">
                <label>Units Required *</label>
                <input v-model.number="newReq.units" type="number" min="1" max="500" placeholder="e.g. 10" required />
              </div>
              <div class="form-group">
                <label>Urgency *</label>
                <select v-model="newReq.urgency" required>
                  <option value="">Select urgency</option>
                  <option>Low</option><option>Medium</option><option>High</option><option>Critical</option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label>Reason for Request *</label>
              <input v-model.trim="newReq.reason" type="text" placeholder="Emergency surgery / Mass casualty / Stock replenishment…" required />
            </div>
            <div class="form-group">
              <label>Additional Notes</label>
              <textarea v-model="newReq.notes" rows="3" placeholder="Any special instructions or context…"></textarea>
            </div>
            <p v-if="newReqError" class="modal-error">{{ newReqError }}</p>
            <div class="modal-actions">
              <button type="button" class="btn-secondary" @click="showNewReqModal = false">Cancel</button>
              <button type="submit" class="btn-primary">Submit Request</button>
            </div>
          </form>
        </div>
      </div>

    <!-- Toast -->
    <transition name="toast">
      <div v-if="toast" class="toast">{{ toast }}</div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useBloodBankStore } from '@/stores/bloodBank'

const auth = useAuthStore()
const store = useBloodBankStore()

onMounted(async () => {
  await auth.fetchUsers()
  await store.fetchExternalRequests('incoming')
  await store.fetchActivity()
})

const ROLES = ['admin', 'doctor', 'nurse', 'staff',  'user']
const tabs = computed(() => [
  { key: 'users',     icon: '👥', label: 'User Management',     sub: 'Manage accounts, roles and permissions' },
  { key: 'interbank', icon: '🏥', label: 'Inter-Bank Requests', sub: 'Manage blood requests from partner banks and hospitals',
    badge: store.pendingExternalRequests > 0 ? store.pendingExternalRequests : null },
  { key: 'activity',  icon: '📋', label: 'Activity Log',        sub: 'System-wide audit trail' },
  { key: 'settings',  icon: '⚙️', label: 'System Settings',     sub: 'Configuration and system information' },
])

const activeTab = ref('users')
const search = ref('')
const toast = ref('')
const modalError = ref('')

// ── Stats ──────────────────────────────────────────────────────────────────
const roleStats = computed(() =>
  ROLES.map(r => ({
    role: r,
    label: r.charAt(0).toUpperCase() + r.slice(1) + 's',
    count: auth.users.filter(u => u.role === r).length,
  }))
)

// ── Filtered users ─────────────────────────────────────────────────────────
const filteredUsers = computed(() => {
  const q = search.value.toLowerCase()
  return auth.users.filter(u =>
    u.name.toLowerCase().includes(q) ||
    u.email.toLowerCase().includes(q) ||
    u.role.toLowerCase().includes(q)
  )
})

// ── Helpers ────────────────────────────────────────────────────────────────
function initials(name) {
  return (name || '').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

function logIcon(type) {
  return { donation: '🩸', request: '📋', fulfill: '✅', donor: '👤' }[type] || '📌'
}

function showToast(msg) {
  toast.value = msg
  setTimeout(() => (toast.value = ''), 2500)
}

// ── Role change ────────────────────────────────────────────────────────────
async function changeRole(userId, newRole) {
  const result = await auth.updateUserRole(userId, newRole)
  if (result.ok) showToast('Role updated.')
  else showToast('Error: ' + result.error)
}

// ── Create User Modal ──────────────────────────────────────────────────────
const showCreateModal = ref(false)
const newUser = reactive({ name: '', email: '', password: '', role: 'staff' })

function openCreateModal() {
  Object.assign(newUser, { name: '', email: '', password: '', role: 'staff' })
  modalError.value = ''
  showCreateModal.value = true
}

async function submitCreate() {
  modalError.value = ''
  if (newUser.password.length < 6) { modalError.value = 'Password must be at least 6 characters.'; return }
  const result = await auth.register_admin({ name: newUser.name, email: newUser.email, password: newUser.password, role: newUser.role })
  if (result.ok) {
    showCreateModal.value = false
    showToast(`User "${newUser.name}" created.`)
  } else {
    modalError.value = result.error
  }
}

// ── Reset Password Modal ───────────────────────────────────────────────────
const showResetModal = ref(false)
const resetTarget = ref(null)
const resetPwd = ref('')

function openResetModal(user) {
  resetTarget.value = user
  resetPwd.value = ''
  modalError.value = ''
  showResetModal.value = true
}

async function submitReset() {
  modalError.value = ''
  const result = await auth.resetPassword(resetTarget.value.id, resetPwd.value)
  if (result.ok) {
    showResetModal.value = false
    showToast('Password reset successfully.')
  } else {
    modalError.value = result.error
  }
}

// ── Delete Modal ───────────────────────────────────────────────────────────
const showDeleteModal = ref(false)
const deleteTarget = ref(null)

function confirmDelete(user) {
  deleteTarget.value = user
  modalError.value = ''
  showDeleteModal.value = true
}

async function submitDelete() {
  modalError.value = ''
  const result = await auth.deleteUser(deleteTarget.value.id)
  if (result.ok) {
    showDeleteModal.value = false
    showToast(`User "${deleteTarget.value.name}" deleted.`)
  } else {
    modalError.value = result.error
  }
}

// ── Danger zone ────────────────────────────────────────────────────────────
async function clearOtherUsers() {
  if (!confirm('This will remove all non-admin user accounts. Continue?')) return
  const others = auth.users.filter(u => u.role !== 'admin' && u.id !== auth.currentUser?.id)
  for (const u of others) await auth.deleteUser(u.id)
  showToast('All non-admin users removed.')
}

// ── Inter-Bank ─────────────────────────────────────────────────────────────
const ibFilters = ['All', 'Pending', 'Approved', 'Declined']
const ibFilter = ref('All')
const ibSearch = ref('')
const ibTypeFilter = ref('')

const ibStats = computed(() => [
  { label: 'Total',    count: store.externalRequests.filter(r => r.direction === 'incoming').length, color: '' },
  { label: 'Pending',  count: store.externalRequests.filter(r => r.direction === 'incoming' && r.status === 'Pending').length,  color: 'orange' },
  { label: 'Approved', count: store.externalRequests.filter(r => r.direction === 'incoming' && r.status === 'Approved').length, color: 'green'  },
  { label: 'Declined', count: store.externalRequests.filter(r => r.direction === 'incoming' && r.status === 'Declined').length, color: 'red'    },
])

const ibFiltered = computed(() => {
  const q = ibSearch.value.toLowerCase()
  return store.externalRequests.filter(r => {
    if (r.direction !== 'incoming') return false
    if (ibFilter.value !== 'All' && r.status !== ibFilter.value) return false
    if (ibTypeFilter.value && r.blood_type !== ibTypeFilter.value) return false
    if (q && !r.bank_name.toLowerCase().includes(q) &&
        !r.contact_name.toLowerCase().includes(q) &&
        !(r.contact_email || '').toLowerCase().includes(q)) return false
    return true
  })
})

function ibInventoryOk(req) {
  const inv = store.inventory.find(i => i.blood_type === req.blood_type)
  return (inv?.units ?? 0) >= req.units
}

const ibConfirm = reactive({ show: false, req: null, action: '' })

function openIbConfirm(id, action) {
  ibConfirm.req = store.externalRequests.find(r => r.id === id)
  ibConfirm.action = action
  ibConfirm.show = true
}

async function submitIbAction() {
  await store.updateExternalBankStatus(ibConfirm.req.id, ibConfirm.action)
  const msg = ibConfirm.action === 'Approved'
    ? `✅ Approved — ${ibConfirm.req.units} units of ${ibConfirm.req.blood_type} dispatched to ${ibConfirm.req.bank_name}`
    : `Request from ${ibConfirm.req.bank_name} declined.`
  showToast(msg)
  ibConfirm.show = false
}

function urgClass(u) {
  return { Low: 'urg-low', Medium: 'urg-med', High: 'urg-high', Critical: 'urg-crit' }[u] || ''
}
function statusClass(s) {
  return { Pending: 'pending', Approved: 'approved', Declined: 'declined' }[s] || 'pending'
}

const showNewReqModal = ref(false)
const newReqError = ref('')
const newReq = reactive({
  requestingBank: '', contactName: '', contactPhone: '', contactEmail: '',
  bloodType: '', units: '', urgency: '', reason: '', notes: ''
})

async function submitNewReq() {
  newReqError.value = ''
  if (!newReq.bloodType || !newReq.units || !newReq.urgency) {
    newReqError.value = 'Please fill in all required fields.'
    return
  }
  await store.submitExternalBankRequest({ ...newReq })
  Object.assign(newReq, {
    requestingBank: '', contactName: '', contactPhone: '', contactEmail: '',
    bloodType: '', units: '', urgency: '', reason: '', notes: ''
  })
  showNewReqModal.value = false
  showToast('Inter-bank request submitted successfully.')
}
</script>

<style scoped>
.admin-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1.75rem;
}

.page-header { margin-bottom: 1.25rem; }
.page-header h1 { margin: 0 0 0.25rem; font-size: 1.6rem; color: #2c3e50; }
.page-sub { margin: 0; color: #7f8c8d; font-size: 0.88rem; }

/* Tab bar */
.tab-bar {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.55rem 1.2rem;
  border: 1.5px solid #dce1e7;
  border-radius: 8px;
  background: #fff;
  color: #555;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}

.tab-btn:hover { border-color: #c0392b; color: #c0392b; }
.tab-btn.active { background: #c0392b; border-color: #c0392b; color: #fff; font-weight: 600; }

.tab-badge {
  background: #e74c3c;
  color: #fff;
  font-size: 0.68rem;
  font-weight: 700;
  border-radius: 99px;
  padding: 0.1rem 0.45rem;
  min-width: 18px;
  text-align: center;
  line-height: 1.5;
}

.tab-btn.active .tab-badge { background: rgba(255,255,255,0.35); }

/* ── Stats bar ───────────────────────────────────────────────────────────── */
.stat-bar {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.stat-card {
  flex: 1;
  min-width: 110px;
  background: #fff;
  border-radius: 10px;
  padding: 1rem 1.25rem;
  box-shadow: 0 1px 6px rgba(0,0,0,.08);
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.stat-card.total {
  background: linear-gradient(135deg, #c0392b, #922b21);
}

.stat-card.total .stat-count,
.stat-card.total .stat-label { color: #fff; }

.stat-count {
  font-size: 1.75rem;
  font-weight: 700;
  color: #2c3e50;
  line-height: 1;
}

.stat-label {
  font-size: 0.78rem;
  color: #7f8c8d;
  text-transform: capitalize;
}

/* ── Panel ───────────────────────────────────────────────────────────────── */
.panel {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 1px 8px rgba(0,0,0,.08);
  overflow: hidden;
}

.panel-toolbar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #eef0f4;
  flex-wrap: wrap;
}

.panel-title {
  font-weight: 600;
  color: #2c3e50;
  flex: 1;
}

.search-input {
  flex: 1;
  min-width: 160px;
  max-width: 300px;
  padding: 0.55rem 0.85rem;
  border: 1.5px solid #dce1e7;
  border-radius: 8px;
  font-size: 0.9rem;
  outline: none;
  transition: border-color 0.2s;
}

.search-input:focus { border-color: #c0392b; }

.btn-add {
  padding: 0.55rem 1.1rem;
  background: #c0392b;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
  white-space: nowrap;
  flex-shrink: 0;
}

.btn-add:hover { opacity: 0.88; }

/* ── Table ───────────────────────────────────────────────────────────────── */
.table-wrap { overflow-x: auto; }

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.88rem;
}

thead th {
  background: #f8f9fb;
  padding: 0.7rem 1rem;
  text-align: left;
  font-weight: 600;
  color: #555;
  border-bottom: 1px solid #eef0f4;
  white-space: nowrap;
}

tbody td {
  padding: 0.8rem 1rem;
  border-bottom: 1px solid #f4f5f8;
  color: #2c3e50;
}

tbody tr:last-child td { border-bottom: none; }
tbody tr:hover td { background: #fdf6f5; }
tbody tr.self-row td { background: #fef9f9; }

.empty { text-align: center; color: #aaa; padding: 2rem; }

.user-cell {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #c0392b, #922b21);
  color: #fff;
  font-size: 0.72rem;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.you-badge {
  display: inline-block;
  margin-left: 0.4rem;
  background: #eaf3fb;
  color: #2980b9;
  font-size: 0.7rem;
  border-radius: 4px;
  padding: 0.1rem 0.4rem;
  font-weight: 600;
  vertical-align: middle;
}

.email-cell { color: #7f8c8d; font-size: 0.83rem; word-break: break-all; }
.date-cell  { color: #95a5a6; font-size: 0.82rem; white-space: nowrap; }
.units-cell { font-weight: 700; text-align: center; }

/* Role select */
.role-select {
  padding: 0.3rem 0.6rem;
  border: 1.5px solid #dce1e7;
  border-radius: 6px;
  font-size: 0.82rem;
  font-weight: 600;
  color: #2c3e50;
  background: #fff;
  cursor: pointer;
  text-transform: capitalize;
}

.role-select:focus { outline: none; border-color: #c0392b; }
.role-select.admin  { color: #c0392b; border-color: rgba(192,57,43,.4); }
.role-select.doctor { color: #2980b9; border-color: rgba(41,128,185,.4); }
.role-select.nurse  { color: #8e44ad; border-color: rgba(142,68,173,.4); }
.role-select.staff  { color: #27ae60; border-color: rgba(39,174,96,.4);  }

/* Action buttons */
.action-btns { display: flex; gap: 0.4rem; flex-wrap: nowrap; white-space: nowrap; }

.btn-icon {
  width: 32px;
  height: 32px;
  border: 1.5px solid #dce1e7;
  border-radius: 6px;
  background: #fff;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn-icon:hover { background: #f4f5f8; }
.btn-icon.danger:hover { background: #fdecea; border-color: #c0392b; }
.btn-icon:disabled { opacity: 0.35; cursor: not-allowed; }

/* ── Activity log ────────────────────────────────────────────────────────── */
.log-list { padding: 0.5rem 0; }

.log-entry {
  display: flex;
  gap: 0.85rem;
  padding: 0.85rem 1.25rem;
  border-bottom: 1px solid #f4f5f8;
  align-items: flex-start;
}

.log-entry:last-child { border-bottom: none; }
.log-icon { font-size: 1.25rem; flex-shrink: 0; line-height: 1.3; }

.log-body p { margin: 0 0 0.2rem; font-size: 0.88rem; color: #2c3e50; }
.log-time { font-size: 0.78rem; color: #95a5a6; }

.btn-danger-sm {
  padding: 0.35rem 0.85rem;
  background: #fdecea;
  color: #c0392b;
  border: 1.5px solid #f5b7b1;
  border-radius: 7px;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
}

.btn-danger-sm:hover { background: #f5b7b1; }

/* ── Settings ────────────────────────────────────────────────────────────── */
.settings-panel { padding: 1.5rem; }
.settings-panel h3 { margin: 0 0 1rem; color: #2c3e50; font-size: 1rem; }

.info-grid {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: 0.6rem 1.5rem;
  margin: 0 0 0.5rem;
  font-size: 0.9rem;
}

.info-grid dt { font-weight: 600; color: #555; }
.info-grid dd { margin: 0; color: #2c3e50; }

.danger-zone {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  background: #fdf5f5;
  border: 1.5px solid #f5b7b1;
  border-radius: 10px;
  padding: 1rem 1.25rem;
  flex-wrap: wrap;
}

.danger-zone strong { display: block; margin-bottom: 0.2rem; color: #c0392b; }
.danger-zone p { margin: 0; font-size: 0.85rem; color: #7f8c8d; }

/* ── Inter-Bank panel ────────────────────────────────────────────────────── */
.ib-panel { overflow: visible; }

.ib-stats {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #eef0f4;
  flex-wrap: wrap;
}

.ib-stat {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.ib-stat-val {
  font-size: 1.5rem;
  font-weight: 700;
  color: #2c3e50;
  line-height: 1;
}

.ib-stat-val.orange { color: #e67e22; }
.ib-stat-val.green  { color: #27ae60; }
.ib-stat-val.red    { color: #c0392b; }

.ib-stat-lbl {
  font-size: 0.72rem;
  color: #7f8c8d;
  white-space: nowrap;
}

.ib-new-btn { margin-left: auto; }

.ib-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.75rem;
  padding: 0.85rem 1.25rem;
  border-bottom: 1px solid #eef0f4;
}

.filter-tabs { display: flex; gap: 0.4rem; flex-wrap: wrap; }

.ftab {
  padding: 0.4rem 0.9rem;
  border: 1.5px solid #dce1e7;
  border-radius: 8px;
  background: #fff;
  font-size: 0.82rem;
  cursor: pointer;
  color: #555;
  transition: all .15s;
}

.ftab:hover { border-color: #c0392b; color: #c0392b; }
.ftab.active { background: #c0392b; border-color: #c0392b; color: #fff; font-weight: 600; }

.ib-toolbar-right {
  display: flex;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.type-select {
  padding: 0.5rem 0.75rem;
  border: 1.5px solid #dce1e7;
  border-radius: 8px;
  font-size: 0.85rem;
  color: #2c3e50;
  background: #fff;
  cursor: pointer;
  outline: none;
}

.type-select:focus { border-color: #c0392b; }

/* Table cells for inter-bank */
.bank-cell { display: flex; align-items: center; gap: 0.5rem; }
.bank-icon { font-size: 1.1rem; }
.contact-cell { display: flex; flex-direction: column; gap: 0.15rem; font-size: 0.83rem; }
.contact-link { color: #2980b9; font-size: 0.78rem; text-decoration: none; }
.contact-link:hover { text-decoration: underline; }
.contact-link.ellipsis { max-width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display: block; }
.reason-cell { max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 0.83rem; }
.resolved-date { display: block; font-size: 0.75rem; color: #95a5a6; }
.action-done { color: #bbb; font-size: 0.85rem; }

.bt-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #c0392b, #922b21);
  color: #fff;
  font-size: 0.75rem;
  font-weight: 700;
  border-radius: 6px;
  padding: 0.2rem 0.5rem;
  min-width: 34px;
}

.urg-chip {
  display: inline-block;
  padding: 0.2rem 0.6rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
}

.urg-low  { background: #e8f8f5; color: #27ae60; }
.urg-med  { background: #fef9e7; color: #d4ac0d; }
.urg-high { background: #fef0e6; color: #e67e22; }
.urg-crit { background: #fdecea; color: #c0392b; }

.status-chip {
  display: inline-block;
  padding: 0.2rem 0.65rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
}

.status-chip.pending  { background: #fef9e7; color: #d4ac0d; }
.status-chip.approved { background: #e8f8f5; color: #27ae60; }
.status-chip.declined { background: #fdecea; color: #c0392b; }

/* Critical row highlight */
.req-row.critical td { border-left: 3px solid #c0392b; }

.btn-approve {
  padding: 0.3rem 0.7rem;
  background: #e8f8f5;
  color: #27ae60;
  border: 1.5px solid #a9dfbf;
  border-radius: 6px;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}

.btn-approve:hover { background: #a9dfbf; }

.btn-decline {
  padding: 0.3rem 0.7rem;
  background: #fdecea;
  color: #c0392b;
  border: 1.5px solid #f5b7b1;
  border-radius: 6px;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}

.btn-decline:hover { background: #f5b7b1; }

/* Inventory check in modal */
.inv-check {
  margin: 0.5rem 0 1rem;
}

.inv-status {
  display: block;
  padding: 0.5rem 0.75rem;
  border-radius: 7px;
  font-size: 0.85rem;
  font-weight: 600;
}

.inv-status.ok   { background: #e8f8f5; color: #27ae60; }
.inv-status.warn { background: #fdf5e8; color: #e67e22; }

/* ── Buttons (shared) ────────────────────────────────────────────────────── */
.btn-danger {
  padding: 0.55rem 1.2rem;
  background: #c0392b;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
}

.btn-danger:hover { background: #a93226; }

/* ── Modal ───────────────────────────────────────────────────────────────── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 500;
  padding: 1rem;
  overflow-y: auto;
}

.modal {
  background: #fff;
  border-radius: 14px;
  padding: 2rem;
  width: 100%;
  max-width: 440px;
  box-shadow: 0 16px 48px rgba(0,0,0,.25);
}

.modal-lg {
  max-width: 680px;
}

.modal h2 { margin: 0 0 1rem; color: #2c3e50; font-size: 1.2rem; }
.modal-desc { margin: -0.5rem 0 1rem; color: #555; font-size: 0.9rem; }

.form-row {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.form-row .form-group { flex: 1; min-width: 160px; }

.form-group { margin-bottom: 1rem; }
.form-group label {
  display: block;
  font-size: 0.82rem;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 0.35rem;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 0.6rem 0.8rem;
  border: 1.5px solid #dce1e7;
  border-radius: 8px;
  font-size: 0.9rem;
  color: #2c3e50;
  box-sizing: border-box;
  outline: none;
  background: #fff;
  font-family: inherit;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus { border-color: #c0392b; }

.form-group textarea { resize: vertical; }

.modal-error {
  color: #c0392b;
  font-size: 0.83rem;
  background: #fdecea;
  border-radius: 6px;
  padding: 0.45rem 0.75rem;
  margin: -0.25rem 0 0.75rem;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.25rem;
}

.btn-primary {
  padding: 0.6rem 1.4rem;
  background: #c0392b;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
}

.btn-primary:hover { background: #a93226; }

.btn-secondary {
  padding: 0.6rem 1.2rem;
  background: #f4f5f8;
  color: #555;
  border: 1.5px solid #dce1e7;
  border-radius: 8px;
  font-size: 0.9rem;
  cursor: pointer;
}

.btn-secondary:hover { background: #eaecf0; }

/* ── Toast ───────────────────────────────────────────────────────────────── */
.toast {
  position: fixed;
  bottom: 1.75rem;
  left: 50%;
  transform: translateX(-50%);
  background: #2c3e50;
  color: #fff;
  padding: 0.65rem 1.5rem;
  border-radius: 24px;
  font-size: 0.9rem;
  box-shadow: 0 4px 16px rgba(0,0,0,.25);
  z-index: 600;
}

.toast-enter-active, .toast-leave-active { transition: opacity 0.3s, transform 0.3s; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateX(-50%) translateY(10px); }

/* ── Responsive ──────────────────────────────────────────────────────────── */
@media (max-width: 768px) {
  .admin-layout { flex-direction: column; }

  .sidebar {
    width: 100% !important;
    min-width: unset !important;
    height: auto;
    position: relative;
    display: none;
  }

  .admin-layout:not(.sidebar-collapsed) .sidebar {
    display: flex;
  }

  .mobile-topbar { display: flex; }
  .admin-main { padding: 1rem; }
  .ib-new-btn { width: 100%; text-align: center; }
}
</style>