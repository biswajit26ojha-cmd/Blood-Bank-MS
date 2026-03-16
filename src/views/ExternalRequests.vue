<template>
  <div class="ext-page">
    <div class="page-header">
      <div>
        <h1>🏥 Inter-Bank Blood Requests</h1>
        <p class="page-sub">Manage incoming and outgoing blood requests with partner banks</p>
      </div>
      <button v-if="activeTab === 'outgoing'" class="btn-new" @click="showNewModal = true">
        ＋ Request from Bank
      </button>
      <button class="btn-refresh" @click="refresh" :disabled="refreshing">
        {{ refreshing ? '⏳' : '🔄' }} Refresh
      </button>
    </div>

    <!-- Tabs -->
    <div class="tab-bar">
      <button :class="['tab-btn', { active: activeTab === 'incoming' }]" @click="activeTab = 'incoming'">
        📥 Incoming Requests
        <span v-if="incomingPending" class="tab-badge">{{ incomingPending }}</span>
      </button>
      <button :class="['tab-btn', { active: activeTab === 'outgoing' }]" @click="activeTab = 'outgoing'">
        📤 Outgoing Requests
        <span v-if="outgoingPending" class="tab-badge">{{ outgoingPending }}</span>
      </button>
    </div>

    <!-- ── INCOMING TAB ──────────────────────────────────────────────────── -->
    <template v-if="activeTab === 'incoming'">
      <!-- Stats -->
      <div class="stat-bar">
        <div class="stat-card" v-for="s in incomingStats" :key="s.label">
          <span class="stat-count" :class="s.color">{{ s.count }}</span>
          <span class="stat-label">{{ s.label }}</span>
        </div>
      </div>

      <!-- Toolbar -->
      <div class="toolbar">
        <div class="filter-tabs">
          <button v-for="f in filters" :key="f" :class="['ftab', { active: inFilter === f }]" @click="inFilter = f">{{ f }}</button>
        </div>
        <div class="toolbar-right">
          <select v-model="inTypeFilter" class="type-select">
            <option value="">All Blood Types</option>
            <option v-for="t in store.BLOOD_TYPES" :key="t" :value="t">{{ t }}</option>
          </select>
          <input v-model="inSearch" class="search-input" placeholder="🔍  Search bank / contact…" />
        </div>
      </div>

      <!-- Table -->
      <div class="table-card">
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Blood Bank</th>
                <th>Contact</th>
                <th>Blood</th>
                <th>Units</th>
                <th>Urgency</th>
                <th>Reason</th>
                <th>Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="filteredIncoming.length === 0">
                <td colspan="9" class="empty">No incoming requests found.</td>
              </tr>
              <tr v-for="r in filteredIncoming" :key="r.id" :class="['req-row', r.urgency.toLowerCase()]">
                <td><div class="bank-cell"><span class="bank-icon">🏥</span><strong>{{ r.bank_name }}</strong></div></td>
                <td>
                  <div class="contact-cell">
                    <span>{{ r.contact_name }}</span>
                    <a :href="'tel:' + r.contact_phone" class="contact-link">{{ r.contact_phone }}</a>
                    <a :href="'mailto:' + r.contact_email" class="contact-link">{{ r.contact_email }}</a>
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
                    <button class="btn-approve" @click="openConfirm(r.id, 'Approved')">✅ Approve</button>
                    <button class="btn-decline" @click="openConfirm(r.id, 'Declined')">✕ Decline</button>
                  </div>
                  <span v-else class="action-done">—</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <!-- ── OUTGOING TAB ──────────────────────────────────────────────────── -->
    <template v-if="activeTab === 'outgoing'">
      <!-- Stats -->
      <div class="stat-bar">
        <div class="stat-card" v-for="s in outgoingStats" :key="s.label">
          <span class="stat-count" :class="s.color">{{ s.count }}</span>
          <span class="stat-label">{{ s.label }}</span>
        </div>
      </div>

      <!-- Toolbar -->
      <div class="toolbar">
        <div class="filter-tabs">
          <button v-for="f in outFilters" :key="f" :class="['ftab', { active: outFilter === f }]" @click="outFilter = f">{{ f }}</button>
        </div>
        <div class="toolbar-right">
          <select v-model="outTypeFilter" class="type-select">
            <option value="">All Blood Types</option>
            <option v-for="t in store.BLOOD_TYPES" :key="t" :value="t">{{ t }}</option>
          </select>
          <input v-model="outSearch" class="search-input" placeholder="🔍  Search bank…" />
        </div>
      </div>

      <!-- Table -->
      <div class="table-card">
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Target Bank</th>
                <th>Contact</th>
                <th>Blood</th>
                <th>Units</th>
                <th>Urgency</th>
                <th>Reason</th>
                <th>Requested</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="filteredOutgoing.length === 0">
                <td colspan="9" class="empty">No outgoing requests yet. <button class="link-btn" @click="showNewModal = true">Request from a bank →</button></td>
              </tr>
              <tr v-for="r in filteredOutgoing" :key="r.id" :class="['req-row', r.urgency.toLowerCase()]">
                <td><div class="bank-cell"><span class="bank-icon">🏥</span><strong>{{ r.bank_name }}</strong></div></td>
                <td>
                  <div class="contact-cell">
                    <span>{{ r.contact_name }}</span>
                    <a :href="'tel:' + r.contact_phone" class="contact-link">{{ r.contact_phone }}</a>
                    <a :href="'mailto:' + r.contact_email" class="contact-link">{{ r.contact_email }}</a>
                  </div>
                </td>
                <td><span class="bt-badge out-badge">{{ r.blood_type }}</span></td>
                <td class="units-cell">{{ r.units }}</td>
                <td><span :class="['urg-chip', urgClass(r.urgency)]">{{ r.urgency }}</span></td>
                <td class="reason-cell" :title="r.reason">{{ r.reason }}</td>
                <td class="date-cell">
                  <span>{{ r.request_date }}</span>
                  <span v-if="r.resolved_date" class="resolved-date">→ {{ r.resolved_date }}</span>
                </td>
                <td><span :class="['status-chip', outStatusClass(r.status)]">{{ r.status }}</span></td>
                <td>
                  <div class="action-btns" v-if="r.status === 'Pending'">
                    <button class="btn-approve" @click="openOutConfirm(r.id, 'Fulfilled')" title="Mark as received — adds to inventory">✅ Received</button>
                    <button class="btn-decline" @click="openOutConfirm(r.id, 'Cancelled')">✕ Cancel</button>
                  </div>
                  <span v-else class="action-done">—</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <!-- ── INCOMING: Approve/Decline Modal ──────────────────────────────── -->
    <div v-if="confirmModal.show" class="modal-overlay" @click.self="confirmModal.show = false">
      <div class="modal">
        <h2>{{ confirmModal.action === 'Approved' ? '✅ Approve Request' : '✕ Decline Request' }}</h2>
        <p v-if="confirmModal.req" class="modal-desc">
          {{ confirmModal.action === 'Approved'
            ? `Dispatch ${confirmModal.req.units} units of ${confirmModal.req.blood_type} to ${confirmModal.req.bank_name} and deduct from inventory.`
            : `Decline the request from ${confirmModal.req.bank_name}?`
          }}
        </p>
        <div v-if="confirmModal.action === 'Approved' && confirmModal.req" class="inv-check">
          <span :class="['inv-status', inventoryOk(confirmModal.req) ? 'ok' : 'warn']">
            {{ inventoryOk(confirmModal.req)
               ? `✅ Sufficient stock: ${store.inventory.find(i => i.blood_type === confirmModal.req.blood_type)?.units} units available`
               : `⚠ Low stock: only ${store.inventory.find(i => i.blood_type === confirmModal.req.blood_type)?.units ?? 0} units available`
            }}
          </span>
        </div>
        <div class="modal-actions">
          <button class="btn-secondary" @click="confirmModal.show = false">Cancel</button>
          <button :class="confirmModal.action === 'Approved' ? 'btn-approve-lg' : 'btn-decline-lg'" @click="submitIncoming">
            Confirm {{ confirmModal.action }}
          </button>
        </div>
      </div>
    </div>

    <!-- ── OUTGOING: Received/Cancel Modal ──────────────────────────────── -->
    <div v-if="outConfirmModal.show" class="modal-overlay" @click.self="outConfirmModal.show = false">
      <div class="modal">
        <h2>{{ outConfirmModal.action === 'Fulfilled' ? '✅ Mark as Received' : '✕ Cancel Request' }}</h2>
        <p v-if="outConfirmModal.req" class="modal-desc">
          {{ outConfirmModal.action === 'Fulfilled'
            ? `Confirm receipt of ${outConfirmModal.req.units} units of ${outConfirmModal.req.blood_type} from ${outConfirmModal.req.bank_name}. This will add the units to your inventory.`
            : `Cancel the pending request to ${outConfirmModal.req.bank_name} for ${outConfirmModal.req.blood_type}?`
          }}
        </p>
        <div class="modal-actions">
          <button class="btn-secondary" @click="outConfirmModal.show = false">Back</button>
          <button :class="outConfirmModal.action === 'Fulfilled' ? 'btn-approve-lg' : 'btn-decline-lg'" @click="submitOutgoing">
            {{ outConfirmModal.action === 'Fulfilled' ? 'Confirm Receipt' : 'Cancel Request' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ── New Outgoing Request Modal ────────────────────────────────────── -->
    <div v-if="showNewModal" class="modal-overlay" @click.self="showNewModal = false">
      <div class="modal modal-lg">
        <h2>📤 Request Blood from Another Bank</h2>
        <form @submit.prevent="submitNewOutgoing">
          <div class="form-row">
            <div class="form-group">
              <label>Target Bank / Hospital *</label>
              <input v-model.trim="newReq.targetBank" type="text" placeholder="City Central Blood Bank" required list="bank-list" autocomplete="off" />
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
              <input v-model="newReq.contactPhone" type="tel" placeholder="11 or 12 digit number" inputmode="numeric" required
                @keypress="$event.key.replace(/\d/,'') && $event.preventDefault()"
                @input="newReq.contactPhone = newReq.contactPhone.replace(/\D/g, '').slice(0,12)"/>
            </div>
            <div class="form-group">
              <label>Contact Email *</label>
              <input v-model.trim="newReq.contactEmail" type="email" placeholder="contact@bank.org" required />
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
              <label>Units Needed *</label>
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
            <label>Reason *</label>
            <input v-model.trim="newReq.reason" type="text" placeholder="Emergency surgery / Inventory shortage / Scheduled procedures…" required />
          </div>
          <div class="form-group">
            <label>Additional Notes</label>
            <textarea v-model="newReq.notes" rows="3" placeholder="Any special instructions or context…"></textarea>
          </div>
          <p v-if="newReqError" class="form-error">{{ newReqError }}</p>
          <div class="modal-actions">
            <button type="button" class="btn-secondary" @click="showNewModal = false">Cancel</button>
            <button type="submit" class="btn-approve-lg">Send Request</button>
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
import { ref, computed, reactive, onMounted, watch } from 'vue'
import { useBloodBankStore } from '@/stores/bloodBank'

const store = useBloodBankStore()

const activeTab = ref('incoming')
const toast = ref('')
const refreshing = ref(false)

async function refresh() {
  refreshing.value = true
  await store.fetchExternalRequests()
  refreshing.value = false
}

onMounted(async () => {
  await store.fetchExternalRequests()
})

watch(activeTab, () => {
  store.fetchExternalRequests()
})

function showToast(msg) {
  toast.value = msg
  setTimeout(() => (toast.value = ''), 3500)
}

// ── Incoming ──────────────────────────────────────────────────────────────
const filters = ['All', 'Pending', 'Approved', 'Declined']
const inFilter = ref('All')
const inTypeFilter = ref('')
const inSearch = ref('')

const incomingAll = computed(() => store.externalRequests.filter(r => r.direction === 'incoming'))
const incomingPending = computed(() => incomingAll.value.filter(r => r.status === 'Pending').length)

const incomingStats = computed(() => [
  { label: 'Total',    count: incomingAll.value.length, color: '' },
  { label: 'Pending',  count: incomingAll.value.filter(r => r.status === 'Pending').length,  color: 'orange' },
  { label: 'Approved', count: incomingAll.value.filter(r => r.status === 'Approved').length, color: 'green' },
  { label: 'Declined', count: incomingAll.value.filter(r => r.status === 'Declined').length, color: 'red' },
])

const filteredIncoming = computed(() => {
  const q = inSearch.value.toLowerCase()
  return incomingAll.value.filter(r => {
    if (inFilter.value !== 'All' && r.status !== inFilter.value) return false
    if (inTypeFilter.value && r.blood_type !== inTypeFilter.value) return false
    if (q && !r.bank_name.toLowerCase().includes(q) && !(r.contact_name || '').toLowerCase().includes(q) && !(r.contact_email || '').toLowerCase().includes(q)) return false
    return true
  })
})

function inventoryOk(req) {
  const inv = store.inventory.find(i => i.blood_type === req.blood_type)
  return (inv?.units ?? 0) >= req.units
}

const confirmModal = reactive({ show: false, req: null, action: '' })

function openConfirm(id, action) {
  confirmModal.req = store.externalRequests.find(r => r.id === id)
  confirmModal.action = action
  confirmModal.show = true
}

async function submitIncoming() {
  await store.updateExternalBankStatus(confirmModal.req.id, confirmModal.action)
  const msg = confirmModal.action === 'Approved'
    ? `✅ Approved — ${confirmModal.req.units} units of ${confirmModal.req.blood_type} dispatched to ${confirmModal.req.bank_name}`
    : `Request from ${confirmModal.req.bank_name} declined.`
  showToast(msg)
  confirmModal.show = false
}

// ── Outgoing ──────────────────────────────────────────────────────────────
const outFilters = ['All', 'Pending', 'Fulfilled', 'Cancelled']
const outFilter = ref('All')
const outTypeFilter = ref('')
const outSearch = ref('')

const outgoingAll = computed(() => store.externalRequests.filter(r => r.direction === 'outgoing'))
const outgoingPending = computed(() => outgoingAll.value.filter(r => r.status === 'Pending').length)

const outgoingStats = computed(() => [
  { label: 'Total',     count: outgoingAll.value.length, color: '' },
  { label: 'Pending',   count: outgoingAll.value.filter(r => r.status === 'Pending').length,   color: 'orange' },
  { label: 'Fulfilled', count: outgoingAll.value.filter(r => r.status === 'Fulfilled').length, color: 'green'  },
  { label: 'Cancelled', count: outgoingAll.value.filter(r => r.status === 'Cancelled').length, color: 'red'    },
])

const filteredOutgoing = computed(() => {
  const q = outSearch.value.toLowerCase()
  return outgoingAll.value.filter(r => {
    if (outFilter.value !== 'All' && r.status !== outFilter.value) return false
    if (outTypeFilter.value && r.blood_type !== outTypeFilter.value) return false
    if (q && !r.bank_name.toLowerCase().includes(q) && !(r.contact_name || '').toLowerCase().includes(q)) return false
    return true
  })
})

const outConfirmModal = reactive({ show: false, req: null, action: '' })

function openOutConfirm(id, action) {
  outConfirmModal.req = store.externalRequests.find(r => r.id === id)
  outConfirmModal.action = action
  outConfirmModal.show = true
}

async function submitOutgoing() {
  await store.updateOutgoingRequestStatus(outConfirmModal.req.id, outConfirmModal.action)
  const msg = outConfirmModal.action === 'Fulfilled'
    ? `✅ Received ${outConfirmModal.req.units} units of ${outConfirmModal.req.blood_type} from ${outConfirmModal.req.bank_name} — inventory updated`
    : `Request to ${outConfirmModal.req.bank_name} cancelled.`
  showToast(msg)
  outConfirmModal.show = false
}

// New outgoing request form
const showNewModal = ref(false)
const newReqError = ref('')
const newReq = reactive({
  targetBank: '', contactName: '', contactPhone: '', contactEmail: '',
  bloodType: '', units: '', urgency: '', reason: '', notes: ''
})

async function submitNewOutgoing() {
  newReqError.value = ''
  if (!newReq.bloodType || !newReq.units || !newReq.urgency) {
    newReqError.value = 'Please fill in all required fields.'
    return
  }
  if (newReq.contactPhone && !/^\d{11,12}$/.test(newReq.contactPhone)) {
    newReqError.value = 'Contact phone must be exactly 11 or 12 digits.'
    return
  }
  await store.submitOutgoingRequest({ ...newReq })
  Object.assign(newReq, { targetBank: '', contactName: '', contactPhone: '', contactEmail: '', bloodType: '', units: '', urgency: '', reason: '', notes: '' })
  showNewModal.value = false
  showToast('📤 Request sent successfully.')
}

// ── Shared helpers ─────────────────────────────────────────────────────────
function urgClass(u) {
  return { Low: 'urg-low', Medium: 'urg-med', High: 'urg-high', Critical: 'urg-crit' }[u] || ''
}
function statusClass(s) {
  return { Pending: 'pending', Approved: 'approved', Declined: 'declined' }[s] || 'pending'
}
function outStatusClass(s) {
  return { Pending: 'pending', Fulfilled: 'approved', Cancelled: 'declined' }[s] || 'pending'
}
</script>
<style scoped>
.ext-page { max-width: 1200px; margin: 0 auto; padding: 2rem 1.5rem; }

.page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem; }
.page-header h1 { margin: 0 0 0.25rem; font-size: 1.75rem; color: #2c3e50; }
.page-sub { margin: 0; font-size: 0.9rem; color: #7f8c8d; }

/* Tab bar */
.tab-bar { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
.tab-btn { display: flex; align-items: center; gap: 0.4rem; padding: 0.55rem 1.2rem; border: 1.5px solid #dce1e7; border-radius: 8px; background: #fff; color: #555; font-size: 0.9rem; cursor: pointer; transition: all .15s; white-space: nowrap; }
.tab-btn:hover { border-color: #1a1a2e; color: #1a1a2e; }
.tab-btn.active { background: #1a1a2e; border-color: #1a1a2e; color: #fff; font-weight: 600; }
.tab-badge { background: #e74c3c; color: #fff; font-size: 0.68rem; font-weight: 700; border-radius: 99px; padding: 0.1rem 0.45rem; min-width: 18px; text-align: center; line-height: 1.5; }
.tab-btn.active .tab-badge { background: rgba(255,255,255,0.3); }

/* New request button */
.btn-refresh { padding: 0.55rem 1rem; background: #fff; color: #555; border: 1.5px solid #dce1e7; border-radius: 8px; font-size: 0.88rem; font-weight: 600; cursor: pointer; white-space: nowrap; }
.btn-refresh:hover:not(:disabled) { border-color: #1a1a2e; color: #1a1a2e; }
.btn-refresh:disabled { opacity: .5; cursor: not-allowed; }

.btn-new { padding: 0.55rem 1.2rem; background: #1a1a2e; color: #fff; border: none; border-radius: 8px; font-size: 0.88rem; font-weight: 600; cursor: pointer; white-space: nowrap; }
.btn-new:hover { background: #16213e; }

/* Outgoing blood-type badge (green) */
.out-badge { background: #27ae60; }

/* Link button */
.link-btn { background: none; border: none; color: #2980b9; cursor: pointer; font-size: inherit; text-decoration: underline; padding: 0; }

/* Large modal for forms */
.modal-lg { max-width: 680px; }

/* Form layout */
.form-row { display: flex; gap: 1rem; flex-wrap: wrap; }
.form-row .form-group { flex: 1; min-width: 160px; }
.form-group { margin-bottom: 1rem; }
.form-group label { display: block; font-size: 0.82rem; font-weight: 600; color: #2c3e50; margin-bottom: 0.35rem; }
.form-group input, .form-group select, .form-group textarea { width: 100%; padding: 0.6rem 0.8rem; border: 1.5px solid #dce1e7; border-radius: 8px; font-size: 0.9rem; color: #2c3e50; box-sizing: border-box; outline: none; background: #fff; font-family: inherit; }
.form-group input:focus, .form-group select:focus, .form-group textarea:focus { border-color: #1a1a2e; }
.form-group textarea { resize: vertical; }
.form-error { color: #c0392b; font-size: 0.83rem; background: #fdecea; border-radius: 6px; padding: 0.45rem 0.75rem; margin: -0.25rem 0 0.75rem; }

/* Stats */
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
  box-shadow: 0 1px 6px rgba(0,0,0,.07);
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.stat-count { font-size: 1.75rem; font-weight: 700; color: #2c3e50; line-height: 1; }
.stat-count.orange { color: #e67e22; }
.stat-count.green  { color: #27ae60; }
.stat-count.red    { color: #c0392b; }
.stat-label { font-size: 0.78rem; color: #7f8c8d; }

/* Toolbar */
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.filter-tabs { display: flex; gap: 0.4rem; }

.ftab {
  padding: 0.45rem 1rem;
  border: 1.5px solid #dce1e7;
  border-radius: 8px;
  background: #fff;
  font-size: 0.85rem;
  cursor: pointer;
  color: #555;
  transition: all .15s;
}

.ftab:hover { border-color: #1a1a2e; color: #1a1a2e; }
.ftab.active { background: #1a1a2e; border-color: #1a1a2e; color: #fff; font-weight: 600; }

.toolbar-right { display: flex; gap: 0.6rem; flex-wrap: wrap; }

.type-select, .search-input {
  padding: 0.5rem 0.85rem;
  border: 1.5px solid #dce1e7;
  border-radius: 8px;
  font-size: 0.88rem;
  outline: none;
  color: #2c3e50;
  background: #fff;
  transition: border-color .2s;
}

.type-select:focus, .search-input:focus { border-color: #1a1a2e; }
.search-input { min-width: 220px; }

/* Table */
.table-card {
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 2px 10px rgba(0,0,0,.08);
  overflow: hidden;
}

.table-wrap { overflow-x: auto; }

table { width: 100%; border-collapse: collapse; font-size: 0.88rem; }

thead th {
  background: #f8f9fb;
  padding: 0.75rem 1rem;
  text-align: left;
  font-weight: 600;
  color: #555;
  border-bottom: 1px solid #eef0f4;
  white-space: nowrap;
}

tbody td {
  padding: 0.85rem 1rem;
  border-bottom: 1px solid #f4f5f8;
  color: #2c3e50;
  vertical-align: middle;
}

tbody tr:last-child td { border-bottom: none; }
tbody tr:hover td { background: #f8f9fb; }

tbody tr.critical td { border-left: 3px solid #c0392b; }
tbody tr.high td     { border-left: 3px solid #e67e22; }

.empty { text-align: center; color: #aaa; padding: 3rem; }

.bank-cell { display: flex; align-items: center; gap: 0.5rem; }
.bank-icon { font-size: 1.1rem; }
.bank-cell strong { font-size: 0.88rem; }

.contact-cell { display: flex; flex-direction: column; gap: 0.15rem; font-size: 0.8rem; }
.contact-link { color: #2980b9; text-decoration: none; font-size: 0.76rem; }
.contact-link:hover { text-decoration: underline; }

.bt-badge {
  display: inline-block;
  background: #1a1a2e;
  color: #fff;
  border-radius: 6px;
  padding: 0.2rem 0.6rem;
  font-size: 0.8rem;
  font-weight: 800;
}

.units-cell { font-weight: 700; font-size: 1rem; color: #2c3e50; }

.urg-chip {
  padding: 0.2rem 0.6rem;
  border-radius: 99px;
  font-size: 0.72rem;
  font-weight: 700;
  white-space: nowrap;
}
.urg-low  { background: #eafaf1; color: #1e8449; }
.urg-med  { background: #fef9e7; color: #d68910; }
.urg-high { background: #fde8e4; color: #c0392b; }
.urg-crit { background: #c0392b; color: #fff; animation: pulse 1.5s infinite; }

@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: .7; } }

.reason-cell { max-width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 0.82rem; color: #7f8c8d; }

.date-cell { font-size: 0.78rem; color: #95a5a6; display: flex; flex-direction: column; gap: 0.15rem; }
.resolved-date { color: #27ae60; }

.status-chip {
  padding: 0.2rem 0.65rem;
  border-radius: 99px;
  font-size: 0.72rem;
  font-weight: 700;
  white-space: nowrap;
}
.status-chip.pending  { background: #fef9e7; color: #d68910; }
.status-chip.approved { background: #eafaf1; color: #1e8449; }
.status-chip.declined { background: #fdecea; color: #c0392b; }

.action-btns { display: flex; gap: 0.4rem; flex-wrap: nowrap; white-space: nowrap; }
.action-done { color: #bdc3c7; font-size: 0.85rem; }
thead th:last-child, tbody td:last-child { white-space: nowrap; min-width: 130px; }

.btn-approve {
  padding: 0.35rem 0.75rem;
  background: #eafaf1;
  color: #1e8449;
  border: 1.5px solid #a9dfbf;
  border-radius: 7px;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: background .15s;
}
.btn-approve:hover { background: #a9dfbf; }

.btn-decline {
  padding: 0.35rem 0.75rem;
  background: #fdecea;
  color: #c0392b;
  border: 1.5px solid #f5b7b1;
  border-radius: 7px;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: background .15s;
}
.btn-decline:hover { background: #f5b7b1; }

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 500;
  padding: 1rem;
}

.modal {
  background: #fff;
  border-radius: 14px;
  padding: 2rem;
  width: 100%;
  max-width: 440px;
  box-shadow: 0 16px 48px rgba(0,0,0,.25);
}

.modal h2 { margin: 0 0 0.75rem; font-size: 1.2rem; color: #2c3e50; }
.modal-desc { margin: 0 0 1rem; font-size: 0.9rem; color: #555; line-height: 1.6; }

.inv-check { margin-bottom: 1.25rem; }

.inv-status {
  display: block;
  padding: 0.6rem 0.9rem;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
}
.inv-status.ok   { background: #eafaf1; color: #1e8449; }
.inv-status.warn { background: #fef9e7; color: #d68910; }

.modal-actions { display: flex; justify-content: flex-end; gap: 0.75rem; }

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

.btn-approve-lg {
  padding: 0.6rem 1.4rem;
  background: #27ae60;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
}
.btn-approve-lg:hover { background: #1e8449; }

.btn-decline-lg {
  padding: 0.6rem 1.4rem;
  background: #c0392b;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
}
.btn-decline-lg:hover { background: #a93226; }

/* Toast */
.toast {
  position: fixed;
  bottom: 1.75rem;
  left: 50%;
  transform: translateX(-50%);
  background: #2c3e50;
  color: #fff;
  padding: 0.7rem 1.5rem;
  border-radius: 24px;
  font-size: 0.9rem;
  box-shadow: 0 4px 16px rgba(0,0,0,.25);
  z-index: 600;
  white-space: nowrap;
}
.toast-enter-active, .toast-leave-active { transition: opacity .3s, transform .3s; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateX(-50%) translateY(10px); }
</style>