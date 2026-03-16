<template>
  <div class="page">
    <header class="page-header">
      <div>
        <h1>Blood Requests</h1>
        <p class="subtitle">Track and manage blood transfusion requests</p>
      </div>
      <button class="btn-primary" @click="showModal = true">+ New Request</button>
    </header>

    <!-- Filters -->
    <div class="toolbar">
      <input v-model="search" type="text" placeholder="Search patient or hospital..." class="search-input" />
      <select v-model="filterStatus" class="select-input">
        <option value="">All Status</option>
        <option>Pending</option>
        <option>Approved</option>
        <option>Fulfilled</option>
        <option>Rejected</option>
      </select>
      <select v-model="filterUrgency" class="select-input">
        <option value="">All Urgency</option>
        <option>Critical</option>
        <option>High</option>
        <option>Medium</option>
        <option>Low</option>
      </select>
      <select v-model="filterBlood" class="select-input">
        <option value="">All Blood Types</option>
        <option v-for="bt in store.BLOOD_TYPES" :key="bt">{{ bt }}</option>
      </select>
      <span class="count-badge">{{ filteredRequests.length }} requests</span>
    </div>

    <!-- Request cards -->
    <div class="requests-grid">
      <div v-if="filteredRequests.length === 0" class="empty-msg">No requests found.</div>
      <div
        v-for="req in filteredRequests"
        :key="req.id"
        class="req-card"
        :class="req.urgency.toLowerCase()"
      >
        <div class="req-top">
          <div class="req-patient-name">{{ req.patient_name }}</div>
          <span class="urgency-pill" :class="req.urgency.toLowerCase()">{{ req.urgency }}</span>
        </div>
        <div class="req-hospital">🏥 {{ req.hospital }}</div>
        <div class="req-meta-row">
          <span class="blood-badge">{{ req.blood_type }}</span>
          <span class="units-badge">{{ req.units }} unit(s)</span>
          <span class="status-pill" :class="statusClass(req.status)">{{ req.status }}</span>
        </div>
        <div class="req-date">Requested: {{ req.request_date }}</div>
        <div class="req-notes" v-if="req.notes">📝 {{ req.notes }}</div>

        <div class="req-actions">
          <template v-if="req.status === 'Pending'">
            <button class="btn-sm approve" @click="updateStatus(req.id, 'Approved')">Approve</button>
            <button class="btn-sm reject" @click="updateStatus(req.id, 'Rejected')">Reject</button>
          </template>
          <template v-if="req.status === 'Approved'">
            <button class="btn-sm fulfill" @click="handleFulfill(req)">Mark Fulfilled</button>
          </template>
          <button class="btn-sm delete" @click="store.deleteRequest(req.id)">Remove</button>
        </div>
      </div>
    </div>

    <!-- Status summary strip -->
    <div class="status-strip">
      <div class="strip-item" v-for="(count, label) in statusCounts" :key="label">
        <div class="strip-count">{{ count }}</div>
        <div class="strip-label">{{ label }}</div>
      </div>
    </div>

    <!-- New Request Modal -->
    <Teleport to="body">
      <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
        <div class="modal">
          <div class="modal-header">
            <h2>New Blood Request</h2>
            <button class="close-btn" @click="showModal = false">✕</button>
          </div>
          <form class="modal-form" @submit.prevent="submitRequest">
            <div class="form-grid">
              <div class="form-group">
                <label>Patient Name *</label>
                <input v-model="form.patientName" type="text" required placeholder="e.g. John Smith" />
              </div>
              <div class="form-group">
                <label>Hospital *</label>
                <input v-model="form.hospital" type="text" required placeholder="e.g. City General Hospital" list="hospital-list" autocomplete="off" />
                <datalist id="hospital-list">
                  <option v-for="h in store.allHospitals" :key="h" :value="h" />
                </datalist>
              </div>
              <div class="form-group">
                <label>Blood Type *</label>
                <select v-model="form.bloodType" required>
                  <option value="" disabled>Select</option>
                  <option v-for="bt in store.BLOOD_TYPES" :key="bt">{{ bt }}</option>
                </select>
              </div>
              <div class="form-group">
                <label>Units Required *</label>
                <input v-model.number="form.units" type="number" min="1" max="20" required />
              </div>
              <div class="form-group">
                <label>Urgency *</label>
                <select v-model="form.urgency" required>
                  <option value="" disabled>Select</option>
                  <option>Critical</option>
                  <option>High</option>
                  <option>Medium</option>
                  <option>Low</option>
                </select>
              </div>
              <div class="form-group full-width">
                <label>Notes</label>
                <textarea v-model="form.notes" rows="2" placeholder="Additional notes..."></textarea>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn-secondary" @click="showModal = false">Cancel</button>
              <button type="submit" class="btn-primary">Submit Request</button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'
import { useBloodBankStore } from '@/stores/bloodBank'

const store = useBloodBankStore()

const search = ref('')
const filterStatus = ref('')
const filterUrgency = ref('')
const filterBlood = ref('')
const showModal = ref(false)

const filteredRequests = computed(() => {
  return store.requests.filter(r => {
    const q = search.value.toLowerCase()
    const matchSearch = !q || (r.patient_name || '').toLowerCase().includes(q) || r.hospital.toLowerCase().includes(q)
    const matchStatus = !filterStatus.value || r.status === filterStatus.value
    const matchUrgency = !filterUrgency.value || r.urgency === filterUrgency.value
    const matchBlood = !filterBlood.value || r.blood_type === filterBlood.value
    return matchSearch && matchStatus && matchUrgency && matchBlood
  })
})

const statusCounts = computed(() => ({
  Pending: store.requests.filter(r => r.status === 'Pending').length,
  Approved: store.requests.filter(r => r.status === 'Approved').length,
  Fulfilled: store.requests.filter(r => r.status === 'Fulfilled').length,
  Rejected: store.requests.filter(r => r.status === 'Rejected').length,
}))

const blankForm = () => ({ patientName: '', hospital: '', bloodType: '', units: 1, urgency: '', notes: '' })
const form = reactive(blankForm())

async function submitRequest() {
  await store.addRequest({ ...form })
  Object.assign(form, blankForm())
  showModal.value = false
}

async function updateStatus(id, status) {
  await store.updateRequestStatus(id, status)
}

async function handleFulfill(req) {
  const inv = store.inventory.find(i => i.blood_type === req.blood_type)
  if (!inv || inv.units < req.units) {
    alert(`Insufficient stock! Available: ${inv?.units ?? 0} unit(s) of ${req.blood_type}, requested: ${req.units}.`)
    return
  }
  if (confirm(`Fulfill request for ${req.patient_name} — ${req.units} unit(s) of ${req.blood_type}? This will deduct from inventory.`)) {
    await store.updateRequestStatus(req.id, 'Fulfilled')
  }
}

function statusClass(status) {
  return { Pending: 'pending', Approved: 'approved', Fulfilled: 'fulfilled', Rejected: 'rejected' }[status] ?? ''
}
</script>

<style scoped>
.page { padding: 2rem; }
.page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; }
.page-header h1 { font-size: 1.75rem; color: #2c3e50; margin: 0 0 .25rem; }
.subtitle { color: #7f8c8d; font-size: .9rem; margin: 0; }

.toolbar { display: flex; gap: .75rem; flex-wrap: wrap; align-items: center; margin-bottom: 1.25rem; }
.search-input { flex: 1; min-width: 200px; padding: .5rem .75rem; border: 1px solid #ddd; border-radius: 6px; font-size: .9rem; }
.select-input { padding: .5rem .75rem; border: 1px solid #ddd; border-radius: 6px; font-size: .9rem; background: #fff; }
.count-badge { background: #ecf0f1; padding: .3rem .75rem; border-radius: 20px; font-size: .8rem; color: #7f8c8d; }

.requests-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1rem; margin-bottom: 1.5rem; }
.empty-msg { color: #95a5a6; font-size: .9rem; padding: 1rem 0; grid-column: 1/-1; }

.req-card { background: #fff; border-radius: 12px; padding: 1.25rem; box-shadow: 0 2px 8px rgba(0,0,0,.08); border-left: 4px solid #bdc3c7; display: flex; flex-direction: column; gap: .5rem; }
.req-card.critical { border-left-color: #8e44ad; }
.req-card.high     { border-left-color: #e74c3c; }
.req-card.medium   { border-left-color: #f39c12; }
.req-card.low      { border-left-color: #27ae60; }

.req-top { display: flex; justify-content: space-between; align-items: center; }
.req-patient-name { font-size: 1rem; font-weight: 700; color: #2c3e50; }

.urgency-pill { font-size: .7rem; font-weight: 700; padding: .2rem .55rem; border-radius: 12px; }
.urgency-pill.critical { background: #8e44ad; color: #fff; }
.urgency-pill.high     { background: #e74c3c; color: #fff; }
.urgency-pill.medium   { background: #f39c12; color: #fff; }
.urgency-pill.low      { background: #27ae60; color: #fff; }

.req-hospital { font-size: .85rem; color: #7f8c8d; }

.req-meta-row { display: flex; align-items: center; gap: .5rem; flex-wrap: wrap; }
.blood-badge { display: inline-block; background: #c0392b; color: #fff; padding: .2rem .55rem; border-radius: 4px; font-size: .8rem; font-weight: 700; }
.units-badge { background: #eaf2fa; color: #2980b9; padding: .2rem .5rem; border-radius: 4px; font-size: .8rem; font-weight: 600; }

.status-pill { font-size: .75rem; font-weight: 700; padding: .2rem .55rem; border-radius: 12px; margin-left: auto; }
.status-pill.pending   { background: #fdebd0; color: #a04000; }
.status-pill.approved  { background: #d5f5e3; color: #1e8449; }
.status-pill.fulfilled { background: #d6eaf8; color: #1a5276; }
.status-pill.rejected  { background: #f9ebea; color: #922b21; }

.req-date { font-size: .78rem; color: #95a5a6; }
.req-notes { font-size: .82rem; color: #7f8c8d; font-style: italic; }

.req-actions { display: flex; gap: .5rem; flex-wrap: wrap; margin-top: .25rem; border-top: 1px solid #f5f5f5; padding-top: .75rem; }
.btn-sm { padding: .3rem .75rem; border: none; border-radius: 5px; font-size: .8rem; font-weight: 600; cursor: pointer; }
.btn-sm.approve  { background: #27ae60; color: #fff; }
.btn-sm.reject   { background: #95a5a6; color: #fff; }
.btn-sm.fulfill  { background: #2980b9; color: #fff; }
.btn-sm.delete   { background: #f5f5f5; color: #e74c3c; }

/* Status strip */
.status-strip { display: flex; gap: 1rem; flex-wrap: wrap; }
.strip-item { background: #fff; border-radius: 10px; padding: 1rem 1.5rem; text-align: center; flex: 1; min-width: 100px; box-shadow: 0 2px 8px rgba(0,0,0,.07); }
.strip-count { font-size: 1.8rem; font-weight: 800; color: #2c3e50; }
.strip-label { font-size: .8rem; color: #7f8c8d; margin-top: .1rem; }

/* Buttons */
.btn-primary  { background: #c0392b; color: #fff; border: none; padding: .55rem 1.25rem; border-radius: 6px; font-size: .9rem; font-weight: 600; cursor: pointer; }
.btn-primary:hover { background: #a93226; }
.btn-secondary { background: #ecf0f1; color: #2c3e50; border: none; padding: .55rem 1.25rem; border-radius: 6px; font-size: .9rem; cursor: pointer; }

/* Modal */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal { background: #fff; border-radius: 14px; width: 580px; max-width: 95vw; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 40px rgba(0,0,0,.2); }
.modal-header { display: flex; justify-content: space-between; align-items: center; padding: 1.25rem 1.5rem; border-bottom: 1px solid #ecf0f1; }
.modal-header h2 { margin: 0; font-size: 1.1rem; color: #2c3e50; }
.close-btn { background: none; border: none; font-size: 1.1rem; cursor: pointer; color: #7f8c8d; }
.modal-form { padding: 1.5rem; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.form-group { display: flex; flex-direction: column; gap: .35rem; }
.form-group.full-width { grid-column: 1 / -1; }
.form-group label { font-size: .8rem; font-weight: 600; color: #7f8c8d; text-transform: uppercase; letter-spacing: .03em; }
.form-group input, .form-group select, .form-group textarea { padding: .5rem .75rem; border: 1px solid #ddd; border-radius: 6px; font-size: .9rem; font-family: inherit; resize: vertical; }
.form-group input:focus, .form-group select:focus, .form-group textarea:focus { outline: none; border-color: #c0392b; }
.modal-footer { display: flex; gap: .75rem; justify-content: flex-end; padding: 1rem 1.5rem; border-top: 1px solid #ecf0f1; }
</style>
