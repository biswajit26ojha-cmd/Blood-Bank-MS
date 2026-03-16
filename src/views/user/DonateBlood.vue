<template>
  <div class="donate-page">
    <div class="page-header">
      <div>
        <h1>💉 Donate Blood</h1>
        <p class="page-sub">Register as a blood donor. Your donation can save up to 3 lives.</p>
      </div>
    </div>

    <!-- Eligibility banner -->
    <div class="eligibility-banner">
      <div class="elig-item">✅ Age 18–65</div>
      <div class="elig-item">✅ Weight ≥ 50 kg</div>
      <div class="elig-item">✅ Haemoglobin ≥ 12.5 g/dL</div>
      <div class="elig-item">✅ No recent illness or surgery</div>
      <div class="elig-item">✅ 3 months since last donation</div>
    </div>

    <div class="page-body">
      <!-- Donation Form -->
      <div class="form-card">
        <h2>Donor Application</h2>
        <form @submit.prevent="handleSubmit" novalidate>
          <div class="form-row">
            <div class="form-group">
              <label>Full Name <span class="req">*</span></label>
              <input v-model.trim="form.name" type="text" placeholder="Your full name" required />
            </div>
            <div class="form-group">
              <label>Blood Type <span class="req">*</span></label>
              <select v-model="form.bloodType" required>
                <option value="" disabled>Select type</option>
                <option v-for="t in BLOOD_TYPES" :key="t" :value="t">{{ t }}</option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Age <span class="req">*</span></label>
              <input v-model.number="form.age" type="number" min="18" max="65" placeholder="e.g. 25" required
                :class="{ 'input-error': errors.age }"
                @input="form.age = String(form.age).replace(/\D/g,'').slice(0,2); errors.age = ''"/>
              <span v-if="errors.age" class="field-error">{{ errors.age }}</span>
            </div>
            <div class="form-group">
              <label>Phone Number <span class="req">*</span></label>
              <input v-model="form.phone" type="tel" placeholder="11 or 12 digit number" inputmode="numeric" required
                :class="{ 'input-error': errors.phone }"
                @keypress="$event.key.replace(/\d/,'') && $event.preventDefault()"
                @input="form.phone = form.phone.replace(/\D/g, '').slice(0,12); errors.phone = ''"/>
              <span v-if="errors.phone" class="field-error">{{ errors.phone }}</span>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Email Address <span class="req">*</span></label>
              <input v-model.trim="form.email" type="email" placeholder="your@email.com" required />
            </div>
            <div class="form-group">
              <label>City <span class="req">*</span></label>
              <input v-model.trim="form.city" type="text" placeholder="e.g. New York" required />
            </div>
          </div>

          <div class="form-group full">
            <label>Last Donation Date (if any)</label>
            <input v-model="form.lastDonation" type="date" :max="today" />
          </div>

          <div class="declaration">
            <label class="check-label">
              <input v-model="form.agree" type="checkbox" />
              <span>I confirm that I meet the eligibility criteria and the information provided is accurate.</span>
            </label>
          </div>

          <p v-if="error" class="error-msg">{{ error }}</p>

          <button type="submit" class="btn-submit" :disabled="loading">
            {{ loading ? 'Submitting…' : '💉 Submit Application' }}
          </button>
        </form>
      </div>

      <!-- My Donations -->
      <div class="my-donations">
        <h2>My Applications</h2>
        <div v-if="myDonations.length === 0" class="empty-state">
          <span>💉</span>
          <p>No applications submitted yet.</p>
        </div>
        <div v-for="d in myDonations" :key="d.id" class="don-card">
          <div class="don-header">
            <span class="bt-pill">{{ d.bloodType }}</span>
            <span :class="['status-chip', statusClass(d.status)]">{{ d.status }}</span>
          </div>
          <div class="don-body">
            <span class="don-field"><strong>Name:</strong> {{ d.name }}</span>
            <span class="don-field"><strong>Age:</strong> {{ d.age }}</span>
            <span class="don-field"><strong>City:</strong> {{ d.city }}</span>
            <span class="don-field"><strong>Phone:</strong> {{ d.phone }}</span>
          </div>
          <div class="don-date">Applied {{ fmtDate(d.createdAt) }}</div>
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
import { ref, reactive, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useBloodBankStore } from '@/stores/bloodBank'

const auth = useAuthStore()
const store = useBloodBankStore()

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
const today = new Date().toISOString().slice(0, 10)

const form = reactive({
  name: auth.currentUser?.name || '',
  bloodType: '', age: '', phone: '', email: auth.currentUser?.email || '',
  city: '', lastDonation: '', agree: false
})
const errors = reactive({ age: '', phone: '' })

function validate() {
  errors.age = ''
  errors.phone = ''
  let valid = true
  const age = Number(form.age)
  if (!form.age && form.age !== 0) {
    errors.age = 'Age is required.'; valid = false
  } else if (!Number.isInteger(age) || age < 18 || age > 65) {
    errors.age = 'Age must be between 18 and 65 (2 digits).'; valid = false
  }
  if (!form.phone) {
    errors.phone = 'Phone is required.'; valid = false
  } else if (!/^\d{11,12}$/.test(form.phone)) {
    errors.phone = 'Phone must be exactly 11 or 12 digits.'; valid = false
  }
  return valid
}

const error = ref('')
const loading = ref(false)
const toast = ref('')

const myDonations = computed(() =>
  store.userSubmissions.filter(s => s.userId === auth.currentUser?.id && s.type === 'donate')
)

async function handleSubmit() {
  error.value = ''
  if (!form.name || !form.bloodType || !form.age || !form.phone || !form.email || !form.city) {
    error.value = 'Please fill in all required fields.'
    return
  }
  if (!validate()) return
  if (!form.agree) {
    error.value = 'Please confirm the eligibility declaration.'
    return
  }

  loading.value = true
  await new Promise(r => setTimeout(r, 300))
  store.submitDonation({
    userId: auth.currentUser.id,
    userName: auth.currentUser.name,
    name: form.name,
    bloodType: form.bloodType,
    age: form.age,
    phone: form.phone,
    email: form.email,
    city: form.city,
    lastDonation: form.lastDonation || null
  })
  loading.value = false

  Object.assign(form, { bloodType: '', age: '', phone: '', city: '', lastDonation: '', agree: false })
  errors.age = ''
  errors.phone = ''
  toast.value = '✅ Application submitted! We will contact you within 48 hours.'
  setTimeout(() => (toast.value = ''), 4000)
}

function statusClass(status) {
  const map = { 'Pending Review': 'pending', Approved: 'approved', Rejected: 'rejected' }
  return map[status] || 'pending'
}

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
</script>

<style scoped>
.donate-page {
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
}

.page-header { margin-bottom: 1.25rem; }
.page-header h1 { margin: 0 0 0.25rem; font-size: 1.75rem; color: #2c3e50; }
.page-sub { margin: 0; font-size: 0.9rem; color: #7f8c8d; }

/* Eligibility banner */
.eligibility-banner {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  background: #eafaf1;
  border: 1.5px solid #a9dfbf;
  border-radius: 10px;
  padding: 0.85rem 1.2rem;
  margin-bottom: 1.75rem;
}

.elig-item {
  font-size: 0.82rem;
  font-weight: 600;
  color: #1e8449;
  white-space: nowrap;
}

.page-body {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 1.5rem;
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

.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}

.form-group { margin-bottom: 1rem; display: flex; flex-direction: column; gap: 0.35rem; }

label { font-size: 0.82rem; font-weight: 600; color: #2c3e50; }
.req { color: #c0392b; }

input, select {
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
}

input:focus, select:focus {
  border-color: #27ae60;
  box-shadow: 0 0 0 3px rgba(39,174,96,.1);
}

.declaration { margin-bottom: 1.25rem; }

.check-label {
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  cursor: pointer;
  font-size: 0.82rem;
  color: #555;
  font-weight: normal;
  line-height: 1.5;
}

.check-label input[type="checkbox"] {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  margin-top: 2px;
}

.error-msg {
  background: #fdecea;
  color: #c0392b;
  border-radius: 7px;
  padding: 0.55rem 0.85rem;
  font-size: 0.85rem;
  margin: -0.25rem 0 1rem;
}
.input-error { border-color: #e74c3c !important; background: #fff5f5; }
.field-error { color: #e74c3c; font-size: 0.75rem; margin-top: 0.1rem; }

.btn-submit {
  width: 100%;
  padding: 0.75rem;
  background: linear-gradient(135deg, #27ae60, #1e8449);
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

/* My Donations panel */
.my-donations h2 { margin: 0 0 1rem; font-size: 1.05rem; color: #2c3e50; }

.don-card {
  background: #fff;
  border-radius: 12px;
  padding: 1rem 1.1rem;
  box-shadow: 0 1px 6px rgba(0,0,0,.07);
  margin-bottom: 0.85rem;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  border-left: 4px solid #27ae60;
}

.don-header { display: flex; align-items: center; gap: 0.6rem; }

.bt-pill {
  background: linear-gradient(135deg, #27ae60, #1e8449);
  color: #fff;
  border-radius: 6px;
  padding: 0.2rem 0.65rem;
  font-size: 0.8rem;
  font-weight: 800;
}

.status-chip {
  margin-left: auto;
  padding: 0.18rem 0.65rem;
  border-radius: 99px;
  font-size: 0.72rem;
  font-weight: 700;
}

.status-chip.pending  { background: #fef9e7; color: #d68910; }
.status-chip.approved { background: #eafaf1; color: #1e8449; }
.status-chip.rejected { background: #fdecea; color: #c0392b; }

.don-body { display: flex; flex-wrap: wrap; gap: 0.4rem 1.2rem; }
.don-field { font-size: 0.82rem; color: #555; }
.don-date  { font-size: 0.75rem; color: #bdc3c7; }

.empty-state { text-align: center; padding: 2rem; color: #95a5a6; font-size: 0.9rem; }
.empty-state span { font-size: 2rem; display: block; margin-bottom: 0.5rem; }

/* Toast */
.toast {
  position: fixed;
  bottom: 1.75rem;
  left: 50%;
  transform: translateX(-50%);
  background: #27ae60;
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
