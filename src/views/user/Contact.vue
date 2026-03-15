<template>
  <div class="contact-page">
    <div class="page-header">
      <h1>✉ Contact Us</h1>
      <p class="page-sub">Reach out to our team — we're here to help 24/7 for medical emergencies.</p>
    </div>

    <div class="page-body">

      <!-- Info cards -->
      <div class="info-col">
        <div class="info-card red">
          <span class="info-icon">📞</span>
          <div>
            <h3>Emergency Hotline</h3>
            <p>+1 (800) 555-BLOOD</p>
            <span class="info-note">Available 24 hours, 7 days a week</span>
          </div>
        </div>
        <div class="info-card blue">
          <span class="info-icon">✉</span>
          <div>
            <h3>Email Us</h3>
            <p>help@bloodbankms.org</p>
            <span class="info-note">Response within 4 business hours</span>
          </div>
        </div>
        <div class="info-card green">
          <span class="info-icon">📍</span>
          <div>
            <h3>Main Centre</h3>
            <p>123 Medical Plaza, Suite 400<br />New York, NY 10001</p>
            <span class="info-note">Mon – Sat: 7 AM – 9 PM</span>
          </div>
        </div>
        <div class="info-card orange">
          <span class="info-icon">🕐</span>
          <div>
            <h3>Operating Hours</h3>
            <p>Weekdays: 7 AM – 9 PM<br />Weekends: 9 AM – 5 PM</p>
            <span class="info-note">Emergency services always open</span>
          </div>
        </div>
      </div>

      <!-- Contact Form -->
      <div class="form-card">
        <h2>Send Us a Message</h2>
        <form @submit.prevent="handleSubmit" novalidate>
          <div class="form-group">
            <label>Full Name <span class="req">*</span></label>
            <input v-model.trim="form.name" type="text" placeholder="Your name" required />
          </div>
          <div class="form-group">
            <label>Email Address <span class="req">*</span></label>
            <input v-model.trim="form.email" type="email" placeholder="your@email.com" required />
          </div>
          <div class="form-group">
            <label>Subject <span class="req">*</span></label>
            <select v-model="form.subject" required>
              <option value="" disabled>Select a subject</option>
              <option value="Blood Request">Blood Request Enquiry</option>
              <option value="Donation">Donation Information</option>
              <option value="Appointment">Schedule Appointment</option>
              <option value="Status">Request Status</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div class="form-group">
            <label>Message <span class="req">*</span></label>
            <textarea v-model.trim="form.message" rows="5" placeholder="Describe how we can help you…" required></textarea>
          </div>

          <p v-if="error" class="error-msg">{{ error }}</p>

          <div v-if="submitted" class="success-msg">
            ✅ Thank you, <strong>{{ form.name }}</strong>! Your message has been received. We'll be in touch soon.
          </div>

          <button v-else type="submit" class="btn-submit" :disabled="loading">
            {{ loading ? 'Sending…' : '📨 Send Message' }}
          </button>
        </form>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()

const form = reactive({
  name: auth.currentUser?.name || '',
  email: auth.currentUser?.email || '',
  subject: '',
  message: ''
})

const error = ref('')
const loading = ref(false)
const submitted = ref(false)

async function handleSubmit() {
  error.value = ''
  if (!form.name || !form.email || !form.subject || !form.message) {
    error.value = 'Please fill in all required fields.'
    return
  }
  loading.value = true
  await new Promise(r => setTimeout(r, 500))
  loading.value = false
  submitted.value = true
}
</script>

<style scoped>
.contact-page {
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
}

.page-header { margin-bottom: 1.75rem; }
.page-header h1 { margin: 0 0 0.25rem; font-size: 1.75rem; color: #2c3e50; }
.page-sub { margin: 0; font-size: 0.9rem; color: #7f8c8d; }

.page-body {
  display: grid;
  grid-template-columns: 1fr 1.3fr;
  gap: 1.5rem;
  align-items: start;
}

/* Info cards */
.info-col { display: flex; flex-direction: column; gap: 1rem; }

.info-card {
  background: #fff;
  border-radius: 12px;
  padding: 1.1rem 1.25rem;
  box-shadow: 0 1px 6px rgba(0,0,0,.07);
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  border-left: 4px solid transparent;
}

.info-card.red    { border-left-color: #c0392b; }
.info-card.blue   { border-left-color: #2980b9; }
.info-card.green  { border-left-color: #27ae60; }
.info-card.orange { border-left-color: #e67e22; }

.info-icon { font-size: 1.6rem; flex-shrink: 0; line-height: 1.3; }

.info-card h3 { margin: 0 0 0.2rem; font-size: 0.88rem; color: #7f8c8d; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
.info-card p  { margin: 0 0 0.25rem; font-size: 0.95rem; font-weight: 600; color: #2c3e50; line-height: 1.5; }
.info-note { font-size: 0.78rem; color: #95a5a6; }

/* Form */
.form-card {
  background: #fff;
  border-radius: 14px;
  padding: 1.75rem;
  box-shadow: 0 2px 10px rgba(0,0,0,.08);
}

.form-card h2 { margin: 0 0 1.25rem; font-size: 1.05rem; color: #2c3e50; }

.form-group { margin-bottom: 1rem; display: flex; flex-direction: column; gap: 0.35rem; }

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
  border-color: #2980b9;
  box-shadow: 0 0 0 3px rgba(41,128,185,.1);
}

textarea { resize: vertical; }

.error-msg {
  background: #fdecea;
  color: #c0392b;
  border-radius: 7px;
  padding: 0.55rem 0.85rem;
  font-size: 0.85rem;
  margin-bottom: 1rem;
}

.success-msg {
  background: #eafaf1;
  border: 1.5px solid #a9dfbf;
  color: #1e8449;
  border-radius: 10px;
  padding: 1rem 1.25rem;
  font-size: 0.9rem;
  line-height: 1.5;
}

.btn-submit {
  width: 100%;
  padding: 0.75rem;
  background: linear-gradient(135deg, #2980b9, #1a5276);
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

@media (max-width: 720px) {
  .page-body { grid-template-columns: 1fr; }
}
</style>
