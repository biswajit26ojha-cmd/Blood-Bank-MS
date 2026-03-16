<template>
  <div class="ebr-page">
    <div class="page-header">
      <div>
        <h1>🏥 Request from Other Blood Banks</h1>
        <p class="page-sub">Can't find the blood type you need here? Submit a request to our partner blood banks network.</p>
      </div>
    </div>

    <!-- How it works -->
    <div class="how-it-works">
      <div class="step" v-for="s in steps" :key="s.n">
        <span class="step-num">{{ s.n }}</span>
        <div>
          <strong>{{ s.title }}</strong>
          <p>{{ s.desc }}</p>
        </div>
      </div>
    </div>

    <div class="page-body">
      <!-- Request Form -->
      <div class="form-card">
        <h2>Submit Inter-Bank Blood Request</h2>
        <form @submit.prevent="handleSubmit" novalidate>

          <div class="section-label">🏥 Requesting Organisation</div>
          <div class="form-row">
            <div class="form-group">
              <label>Hospital / Blood Bank Name <span class="req">*</span></label>
              <input v-model.trim="form.requestingBank" type="text" placeholder="e.g. City General Hospital" required list="org-list" autocomplete="off" />
              <datalist id="org-list">
                <option v-for="h in [...store.allHospitals, ...store.allBanks]" :key="h" :value="h" />
              </datalist>
            </div>
            <div class="form-group">
              <label>Contact Person <span class="req">*</span></label>
              <input v-model.trim="form.contactName" type="text" placeholder="Dr. / Mr. / Ms. ..." required />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Contact Phone <span class="req">*</span></label>
              <input v-model="form.contactPhone" type="tel" placeholder="11 or 12 digit number" inputmode="numeric" required
                @keypress="$event.key.replace(/\d/,'') && $event.preventDefault()"
                @input="form.contactPhone = form.contactPhone.replace(/\D/g, '').slice(0,12)"/>
            </div>
            <div class="form-group">
              <label>Contact Email <span class="req">*</span></label>
              <input v-model.trim="form.contactEmail" type="email" placeholder="doctor@hospital.org" required />
            </div>
          </div>

          <div class="section-label">🩸 Blood Requirement</div>
          <div class="form-row three">
            <div class="form-group">
              <label>Blood Type <span class="req">*</span></label>
              <select v-model="form.bloodType" required>
                <option value="" disabled>Select type</option>
                <option v-for="t in BLOOD_TYPES" :key="t" :value="t">{{ t }}</option>
              </select>
            </div>
            <div class="form-group">
              <label>Units Required <span class="req">*</span></label>
              <input v-model.number="form.units" type="number" min="1" max="50" placeholder="e.g. 5" required />
            </div>
            <div class="form-group">
              <label>Urgency <span class="req">*</span></label>
              <select v-model="form.urgency" required>
                <option value="Low">Low — Planned</option>
                <option value="Medium">Medium — Within 48 h</option>
                <option value="High">High — Within 24 h</option>
                <option value="Critical">Critical — Immediate</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label>Reason for Request <span class="req">*</span></label>
            <input v-model.trim="form.reason" type="text" placeholder="e.g. Inventory shortage, mass casualty event…" required />
          </div>
          <div class="form-group">
            <label>Additional Notes</label>
            <textarea v-model.trim="form.notes" rows="3" placeholder="Any extra details for the receiving blood bank team…"></textarea>
          </div>

          <p v-if="error" class="error-msg">{{ error }}</p>
          <button type="submit" class="btn-submit" :disabled="loading">
            {{ loading ? 'Submitting…' : '📨 Submit Request' }}
          </button>
        </form>
      </div>

      <!-- My Requests -->
      <div class="my-panel">
        <h2>My Submitted Requests</h2>
        <div v-if="myRequests.length === 0" class="empty-state">
          <span>🏥</span>
          <p>No inter-bank requests submitted yet.</p>
        </div>
        <div v-for="r in myRequests" :key="r.id" class="req-card">
          <div class="req-top">
            <span class="bt-pill">{{ r.blood_type }}</span>
            <span :class="['urg-chip', urgClass(r.urgency)]">{{ r.urgency }}</span>
            <span :class="['status-chip', statusClass(r.status)]">{{ r.status }}</span>
          </div>
          <div class="req-info">
            <span><strong>Bank:</strong> {{ r.bank_name }}</span>
            <span><strong>Units:</strong> {{ r.units }}</span>
            <span><strong>Reason:</strong> {{ r.reason }}</span>
          </div>
          <div class="req-footer">
            <span class="req-date">Submitted {{ r.request_date }}</span>
            <span v-if="r.resolved_date" class="req-date">&middot; Resolved {{ r.resolved_date }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Partner Network Info -->
    <div class="partner-section">
      <h2>🤝 Our Partner Blood Bank Network</h2>
      <div class="partner-grid">
        <div v-for="p in partners" :key="p.name" class="partner-card">
          <span class="partner-icon">🏥</span>
          <div>
            <strong>{{ p.name }}</strong>
            <p>{{ p.location }}</p>
            <span class="partner-phone">{{ p.phone }}</span>
          </div>
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
import { ref, reactive, onMounted } from 'vue'
import { useBloodBankStore } from '@/stores/bloodBank'
import { api } from '@/services/api'

const store = useBloodBankStore()

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

const steps = [
  { n: '1', title: 'Fill the form', desc: 'Provide your hospital details and the blood type required.' },
  { n: '2', title: 'We contact partners', desc: 'Our team reaches out to our network of blood banks.' },
  { n: '3', title: 'Confirmation', desc: 'You are notified once a partner confirms availability.' },
  { n: '4', title: 'Blood transfer', desc: 'Units are dispatched to your facility with full documentation.' },
]

const partners = [
  { name: 'Metro Blood Centre', location: 'Downtown, New York', phone: '+1 (555) 200-1001' },
  { name: 'Westside Community Bank', location: 'West Village, Chicago', phone: '+1 (555) 300-2002' },
  { name: 'Regional Medical Supply', location: 'Houston Medical District', phone: '+1 (555) 400-3003' },
  { name: 'NorthEast Blood Alliance', location: 'Boston, MA', phone: '+1 (555) 500-4004' },
  { name: 'SunCoast Blood Services', location: 'Miami, FL', phone: '+1 (555) 600-5005' },
  { name: 'Pacific Regional Blood Bank', location: 'Los Angeles, CA', phone: '+1 (555) 700-6006' },
]

const form = reactive({
  requestingBank: '', contactName: '', contactPhone: '', contactEmail: '',
  bloodType: '', units: 1, urgency: 'High', reason: '', notes: ''
})

const error = ref('')
const loading = ref(false)
const toast = ref('')

const myRequests = ref([])

async function loadMyRequests() {
  try {
    const d = await api.getMyExternalRequests()
    myRequests.value = d.requests
  } catch (e) { console.error('Could not load requests:', e) }
}

onMounted(loadMyRequests)

async function handleSubmit() {
  error.value = ''
  if (!form.requestingBank || !form.contactName || !form.contactPhone || !form.contactEmail || !form.bloodType || !form.units || !form.reason) {
    error.value = 'Please fill in all required fields.'
    return
  }
  if (!/^\d{11,12}$/.test(form.contactPhone)) {
    error.value = 'Contact phone must be exactly 11 or 12 digits.'
    return
  }
  loading.value = true
  try {
    await api.createExternalRequest({
      direction: 'incoming',
      bank_name: form.requestingBank,
      contact_name: form.contactName,
      contact_phone: form.contactPhone,
      contact_email: form.contactEmail,
      blood_type: form.bloodType,
      units: form.units,
      urgency: form.urgency,
      reason: form.reason,
      notes: form.notes || null,
    })
    await loadMyRequests()
    Object.assign(form, { requestingBank: '', contactName: '', contactPhone: '', contactEmail: '', bloodType: '', units: 1, urgency: 'High', reason: '', notes: '' })
    toast.value = '✅ Request submitted! Our team will contact partner banks within 2 hours.'
    setTimeout(() => (toast.value = ''), 4000)
  } catch (e) {
    error.value = e.message || 'Submission failed. Please try again.'
  } finally {
    loading.value = false
  }
}

function urgClass(u) {
  return { Low: 'urg-low', Medium: 'urg-med', High: 'urg-high', Critical: 'urg-crit' }[u] || ''
}

function statusClass(s) {
  return { Pending: 'pending', Approved: 'approved', Declined: 'declined' }[s] || 'pending'
}
</script>

<style scoped>
.ebr-page {
  max-width: 1050px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
}

.page-header { margin-bottom: 1.5rem; }
.page-header h1 { margin: 0 0 0.25rem; font-size: 1.75rem; color: #2c3e50; }
.page-sub { margin: 0; font-size: 0.9rem; color: #7f8c8d; }

/* How it works */
.how-it-works {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;
}

.step {
  background: #fff;
  border-radius: 12px;
  padding: 1.1rem;
  box-shadow: 0 1px 6px rgba(0,0,0,.06);
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
}

.step-num {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: linear-gradient(135deg, #1a1a2e, #16213e);
  color: #fff;
  font-size: 0.82rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.step strong { font-size: 0.88rem; color: #2c3e50; display: block; margin-bottom: 0.2rem; }
.step p { margin: 0; font-size: 0.78rem; color: #7f8c8d; line-height: 1.4; }

/* Page body */
.page-body {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 1.5rem;
  margin-bottom: 2rem;
  align-items: start;
}

/* Form */
.form-card {
  background: #fff;
  border-radius: 14px;
  padding: 1.75rem;
  box-shadow: 0 2px 10px rgba(0,0,0,.08);
}

.form-card h2 { margin: 0 0 1.25rem; font-size: 1.05rem; color: #2c3e50; }

.section-label {
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  color: #95a5a6;
  margin: 1rem 0 0.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #f0f2f5;
}

.section-label:first-of-type { margin-top: 0; }

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.9rem;
}
.form-row.three { grid-template-columns: 1fr 1fr 1fr; }

.form-group { margin-bottom: 0.85rem; display: flex; flex-direction: column; gap: 0.35rem; }

label { font-size: 0.82rem; font-weight: 600; color: #2c3e50; }
.req { color: #c0392b; }

input, select, textarea {
  padding: 0.62rem 0.82rem;
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
  border-color: #1a1a2e;
  box-shadow: 0 0 0 3px rgba(26,26,46,.08);
}

textarea { resize: vertical; }

.error-msg {
  background: #fdecea;
  color: #c0392b;
  border-radius: 7px;
  padding: 0.55rem 0.85rem;
  font-size: 0.84rem;
  margin-bottom: 1rem;
}

.btn-submit {
  width: 100%;
  padding: 0.75rem;
  background: linear-gradient(135deg, #1a1a2e, #0f3460);
  color: #fff;
  border: none;
  border-radius: 9px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity .2s;
  margin-top: 0.5rem;
}

.btn-submit:hover:not(:disabled) { opacity: .88; }
.btn-submit:disabled { opacity: .5; cursor: not-allowed; }

/* My Requests panel */
.my-panel h2 { margin: 0 0 1rem; font-size: 1.05rem; color: #2c3e50; }

.req-card {
  background: #fff;
  border-radius: 12px;
  padding: 1rem 1.1rem;
  box-shadow: 0 1px 6px rgba(0,0,0,.07);
  margin-bottom: 0.85rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  border-left: 4px solid #16213e;
}

.req-top { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }

.bt-pill {
  background: linear-gradient(135deg, #1a1a2e, #0f3460);
  color: #fff;
  border-radius: 6px;
  padding: 0.2rem 0.65rem;
  font-size: 0.78rem;
  font-weight: 800;
}

.urg-chip {
  padding: 0.18rem 0.55rem;
  border-radius: 99px;
  font-size: 0.7rem;
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
  font-size: 0.7rem;
  font-weight: 700;
}
.status-chip.pending  { background: #fef9e7; color: #d68910; }
.status-chip.approved { background: #eafaf1; color: #1e8449; }
.status-chip.declined { background: #fdecea; color: #c0392b; }

.req-info { display: flex; flex-direction: column; gap: 0.2rem; font-size: 0.82rem; color: #555; }
.req-footer { display: flex; gap: 0.5rem; }
.req-date { font-size: 0.75rem; color: #bdc3c7; }

.empty-state { text-align: center; padding: 2.5rem 1rem; color: #95a5a6; }
.empty-state span { font-size: 2.5rem; display: block; margin-bottom: 0.75rem; }
.empty-state p { margin: 0; font-size: 0.9rem; }

/* Partner Network */
.partner-section {
  background: #fff;
  border-radius: 14px;
  padding: 1.75rem;
  box-shadow: 0 2px 10px rgba(0,0,0,.07);
}

.partner-section h2 { margin: 0 0 1.25rem; font-size: 1.1rem; color: #2c3e50; }

.partner-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1rem;
}

.partner-card {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  background: #f8f9fb;
  border-radius: 10px;
  padding: 1rem;
  border: 1.5px solid #eef0f4;
}

.partner-icon { font-size: 1.5rem; flex-shrink: 0; line-height: 1.3; }
.partner-card strong { font-size: 0.9rem; color: #2c3e50; display: block; margin-bottom: 0.15rem; }
.partner-card p { margin: 0 0 0.25rem; font-size: 0.78rem; color: #7f8c8d; }
.partner-phone { font-size: 0.78rem; font-weight: 600; color: #2980b9; }

/* Toast */
.toast {
  position: fixed;
  bottom: 1.75rem;
  left: 50%;
  transform: translateX(-50%);
  background: #1a1a2e;
  color: #fff;
  padding: 0.7rem 1.5rem;
  border-radius: 24px;
  font-size: 0.9rem;
  box-shadow: 0 4px 16px rgba(0,0,0,.3);
  z-index: 600;
  white-space: nowrap;
}

.toast-enter-active, .toast-leave-active { transition: opacity .3s, transform .3s; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateX(-50%) translateY(10px); }

@media (max-width: 850px) {
  .how-it-works { grid-template-columns: repeat(2, 1fr); }
  .page-body { grid-template-columns: 1fr; }
  .form-row.three { grid-template-columns: 1fr 1fr; }
}

@media (max-width: 500px) {
  .how-it-works { grid-template-columns: 1fr; }
  .form-row, .form-row.three { grid-template-columns: 1fr; }
}
</style>
