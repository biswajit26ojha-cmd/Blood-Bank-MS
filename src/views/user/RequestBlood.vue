<template>
  <div class="request-page">
    <div class="page-header">
      <div>
        <h1>🩸 Request Blood</h1>
        <p class="page-sub">Fill in the form below to submit a blood request. Our team will respond promptly.</p>
      </div>
    </div>

    <div class="page-body">
      <!-- Form -->
      <div class="form-card">
        <h2>New Blood Request</h2>
        <form @submit.prevent="handleSubmit" novalidate>
          <div class="form-row">
            <div class="form-group">
              <label>Patient Name <span class="req">*</span></label>
              <input v-model.trim="form.patientName" type="text" placeholder="Full name of patient" required />
            </div>
            <div class="form-group">
              <label>Hospital / Medical Centre <span class="req">*</span></label>
              <input v-model.trim="form.hospital" type="text" placeholder="e.g. City General Hospital" required list="hospital-list" autocomplete="off" />
              <datalist id="hospital-list">
                <option v-for="h in store.allHospitals" :key="h" :value="h" />
              </datalist>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Blood Type Required <span class="req">*</span></label>
              <select v-model="form.bloodType" required>
                <option value="" disabled>Select blood type</option>
                <option v-for="t in BLOOD_TYPES" :key="t" :value="t">{{ t }}</option>
              </select>
            </div>
            <div class="form-group">
              <label>Units Required <span class="req">*</span></label>
              <input v-model.number="form.units" type="number" min="1" max="20" placeholder="e.g. 2" required />
            </div>
            <div class="form-group">
              <label>Urgency Level <span class="req">*</span></label>
              <select v-model="form.urgency" required>
                <option value="Low">Low — Elective procedure</option>
                <option value="Medium">Medium — Within 48 h</option>
                <option value="High">High — Within 24 h</option>
                <option value="Critical">Critical — Immediate</option>
              </select>
            </div>
          </div>

          <div class="form-group full">
            <label>Additional Notes</label>
            <textarea v-model.trim="form.notes" rows="3" placeholder="Any additional information about the patient or condition…"></textarea>
          </div>

          <!-- Availability hint -->
          <div v-if="form.bloodType" class="avail-hint" :class="availClass(store.inventory[form.bloodType]?.units)">
            <span class="avail-icon">{{ availIcon(store.inventory[form.bloodType]?.units) }}</span>
            <span><strong>{{ form.bloodType }}</strong> — {{ store.inventory[form.bloodType]?.units ?? 0 }} units currently available
              ({{ availLabel(store.inventory[form.bloodType]?.units) }})</span>
          </div>

          <p v-if="error" class="error-msg">{{ error }}</p>

          <button type="submit" class="btn-submit" :disabled="loading">
            {{ loading ? 'Submitting…' : '🩸 Submit Request' }}
          </button>
        </form>
      </div>

      <!-- My Requests -->
      <div class="my-requests">
        <h2>My Blood Requests</h2>
        <div v-if="myRequests.length === 0" class="empty-state">
          <span>📋</span>
          <p>No requests submitted yet.</p>
        </div>
        <div v-for="r in myRequests" :key="r.id" class="req-card">
          <div class="req-header">
            <span class="bt-pill">{{ r.bloodType }}</span>
            <span :class="['urg-chip', urgClass(r.urgency)]">{{ r.urgency }}</span>
            <span :class="['status-chip', statusClass(requestStatus(r))]">{{ requestStatus(r) }}</span>
          </div>
          <div class="req-body">
            <span class="req-field"><strong>Patient:</strong> {{ r.patientName }}</span>
            <span class="req-field"><strong>Hospital:</strong> {{ r.hospital }}</span>
            <span class="req-field"><strong>Units:</strong> {{ r.units }}</span>
          </div>
          <div class="req-footer">
            <span v-if="r.notes" class="req-notes">📝 {{ r.notes }}</span>
            <span class="req-date">{{ fmtDate(r.createdAt) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Success Toast -->
    <transition name="toast">
      <div v-if="toast" class="toast">{{ toast }}</div>
    </transition>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useBloodBankStore } from '@/stores/bloodBank'

const auth = useAuthStore()
const store = useBloodBankStore()

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

const form = reactive({
  patientName: '', hospital: '', bloodType: '', units: 1, urgency: 'Medium', notes: ''
})

const error = ref('')
const loading = ref(false)
const toast = ref('')

const myRequests = computed(() =>
  store.userSubmissions.filter(s => s.userId === auth.currentUser?.id && s.type === 'request')
)

function requestStatus(sub) {
  if (sub.linkedRequestId) {
    const req = store.requests.find(r => r.id === sub.linkedRequestId)
    if (req) return req.status
  }
  return 'Pending'
}

async function handleSubmit() {
  error.value = ''
  if (!form.patientName || !form.hospital || !form.bloodType || !form.units) {
    error.value = 'Please fill in all required fields.'
    return
  }
  if (form.units < 1) { error.value = 'Units must be at least 1.'; return }

  loading.value = true
  await new Promise(r => setTimeout(r, 300))
  store.submitBloodRequest({
    userId: auth.currentUser.id,
    userName: auth.currentUser.name,
    patientName: form.patientName,
    hospital: form.hospital,
    bloodType: form.bloodType,
    units: form.units,
    urgency: form.urgency,
    notes: form.notes
  })
  loading.value = false

  // Reset form
  Object.assign(form, { patientName: '', hospital: '', bloodType: '', units: 1, urgency: 'Medium', notes: '' })
  toast.value = '✅ Request submitted! Our team will review it shortly.'
  setTimeout(() => (toast.value = ''), 3500)
}

function availClass(units) {
  if (units <= 5) return 'critical'
  if (units <= 10) return 'low'
  return 'good'
}

function availLabel(units) {
  if (units <= 5) return 'critically low'
  if (units <= 10) return 'low'
  return 'available'
}

function availIcon(units) {
  if (units <= 5) return '🔴'
  if (units <= 10) return '🟡'
  return '🟢'
}

function urgClass(u) {
  return { Low: 'urg-low', Medium: 'urg-med', High: 'urg-high', Critical: 'urg-crit' }[u] || ''
}

function statusClass(status) {
  const map = { Pending: 'pending', Approved: 'approved', Fulfilled: 'fulfilled', Rejected: 'rejected' }
  return map[status] || 'pending'
}

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
</script>

<style scoped>
.request-page {
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
}

.page-header { margin-bottom: 1.75rem; }
.page-header h1 { margin: 0 0 0.25rem; font-size: 1.75rem; color: #2c3e50; }
.page-sub { margin: 0; font-size: 0.9rem; color: #7f8c8d; }

.page-body {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 1.5rem;
  align-items: start;
}

/* Form card */
.form-card {
  background: #fff;
  border-radius: 14px;
  padding: 1.75rem;
  box-shadow: 0 2px 10px rgba(0,0,0,.08);
}

.form-card h2 { margin: 0 0 1.25rem; font-size: 1.05rem; color: #2c3e50; }

.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}

.form-group { margin-bottom: 1rem; display: flex; flex-direction: column; gap: 0.35rem; }
.form-group.full { grid-column: 1 / -1; }

label { font-size: 0.82rem; font-weight: 600; color: #2c3e50; }
.req { color: #c0392b; }

input, select, textarea {
  padding: 0.65rem 0.85rem;
  border: 1.5px solid #dce1e7;
  border-radius: 8px;
  font-size: 0.9rem;
  color: #2c3e50;
  outline: none;
  transition: border-color .2s;
  box-sizing: border-box;
  width: 100%;
  background: #fff;
  font-family: inherit;
}

input:focus, select:focus, textarea:focus {
  border-color: #c0392b;
  box-shadow: 0 0 0 3px rgba(192,57,43,.1);
}

textarea { resize: vertical; }

.avail-hint {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  border-radius: 8px;
  padding: 0.65rem 0.9rem;
  font-size: 0.85rem;
  margin-bottom: 1rem;
}

.avail-hint.good     { background: #eafaf1; color: #1e8449; }
.avail-hint.low      { background: #fef9e7; color: #d68910; }
.avail-hint.critical { background: #fdecea; color: #c0392b; }
.avail-icon { font-size: 1.1rem; }

.error-msg {
  background: #fdecea;
  color: #c0392b;
  border-radius: 7px;
  padding: 0.55rem 0.85rem;
  font-size: 0.85rem;
  margin: -0.25rem 0 1rem;
}

.btn-submit {
  width: 100%;
  padding: 0.75rem;
  background: linear-gradient(135deg, #c0392b, #922b21);
  color: #fff;
  border: none;
  border-radius: 9px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity .2s;
}

.btn-submit:hover:not(:disabled) { opacity: .88; }
.btn-submit:disabled { opacity: .55; cursor: not-allowed; }

/* My Requests */
.my-requests h2 { margin: 0 0 1rem; font-size: 1.05rem; color: #2c3e50; }

.req-card {
  background: #fff;
  border-radius: 12px;
  padding: 1rem 1.1rem;
  box-shadow: 0 1px 6px rgba(0,0,0,.07);
  margin-bottom: 0.85rem;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

.req-header { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }

.bt-pill {
  background: linear-gradient(135deg, #c0392b, #922b21);
  color: #fff;
  border-radius: 6px;
  padding: 0.2rem 0.6rem;
  font-size: 0.8rem;
  font-weight: 800;
}

.urg-chip {
  padding: 0.18rem 0.55rem;
  border-radius: 99px;
  font-size: 0.72rem;
  font-weight: 700;
}

.urg-low  { background: #eafaf1; color: #1e8449; }
.urg-med  { background: #fef9e7; color: #d68910; }
.urg-high { background: #fde8e4; color: #c0392b; }
.urg-crit { background: #c0392b; color: #fff; }

.status-chip {
  margin-left: auto;
  padding: 0.18rem 0.65rem;
  border-radius: 99px;
  font-size: 0.72rem;
  font-weight: 700;
}

.status-chip.pending   { background: #fef9e7; color: #d68910; }
.status-chip.approved  { background: #eafaf1; color: #1e8449; }
.status-chip.fulfilled { background: #eaf4fb; color: #1a5276; }
.status-chip.rejected  { background: #fdecea; color: #c0392b; }

.req-body { display: flex; flex-wrap: wrap; gap: 0.5rem 1.5rem; }
.req-field { font-size: 0.82rem; color: #555; }

.req-footer { display: flex; align-items: center; justify-content: space-between; }
.req-notes { font-size: 0.78rem; color: #7f8c8d; font-style: italic; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.req-date  { font-size: 0.74rem; color: #bdc3c7; }

.empty-state { text-align: center; padding: 2rem; color: #95a5a6; font-size: 0.9rem; }
.empty-state span { font-size: 2rem; display: block; margin-bottom: 0.5rem; }

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

@media (max-width: 750px) {
  .page-body { grid-template-columns: 1fr; }
}
</style>
