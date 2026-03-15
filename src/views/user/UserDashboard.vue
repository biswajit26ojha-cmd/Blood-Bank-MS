<template>
  <div class="user-dashboard">

    <!-- Hero -->
    <div class="hero">
      <div class="hero-content">
        <h1>Welcome back, <span class="hero-name">{{ firstName }}</span> 👋</h1>
        <p>Find blood, request help, register to donate, or reach out to our team. Every action saves lives.</p>
      </div>
      <div class="hero-art">🩸</div>
    </div>

    <!-- Quick Actions -->
    <div class="action-grid">
      <RouterLink to="/search-blood" class="action-card blue">
        <span class="ac-icon">🔍</span>
        <h3>Search Blood</h3>
        <p>Check real-time availability of all blood types</p>
        <span class="ac-arrow">→</span>
      </RouterLink>
      <RouterLink to="/request-blood" class="action-card red">
        <span class="ac-icon">🩸</span>
        <h3>Request Blood</h3>
        <p>Submit an urgent or scheduled blood request</p>
        <span class="ac-arrow">→</span>
      </RouterLink>
      <RouterLink to="/donate-blood" class="action-card green">
        <span class="ac-icon">💉</span>
        <h3>Donate Blood</h3>
        <p>Register as a donor and help save lives</p>
        <span class="ac-arrow">→</span>
      </RouterLink>
      <RouterLink to="/contact" class="action-card orange">
        <span class="ac-icon">✉</span>
        <h3>Contact Us</h3>
        <p>Get help from our blood bank team</p>
        <span class="ac-arrow">→</span>
      </RouterLink>
    </div>

    <!-- Body -->
    <div class="dashboard-body">

      <!-- My Activity Panel -->
      <div class="activity-panel">
        <div class="panel-header">
          <h2>My Submissions</h2>
          <div class="tab-group">
            <button :class="['tab-btn', { active: tab === 'requests' }]" @click="tab = 'requests'">
              🩸 Blood Requests <span class="badge" v-if="myRequests.length">{{ myRequests.length }}</span>
            </button>
            <button :class="['tab-btn', { active: tab === 'donations' }]" @click="tab = 'donations'">
              💉 Donations <span class="badge" v-if="myDonations.length">{{ myDonations.length }}</span>
            </button>
          </div>
        </div>

        <!-- Blood Requests Tab -->
        <div v-if="tab === 'requests'">
          <div v-if="myRequests.length === 0" class="empty-state">
            <span class="empty-icon">📋</span>
            <p>No blood requests submitted yet.</p>
            <RouterLink to="/request-blood" class="empty-link">Submit a request →</RouterLink>
          </div>
          <div v-for="r in myRequests" :key="r.id" class="submission-row">
            <div class="sub-blood-badge" :class="typeClass(r.bloodType)">{{ r.bloodType }}</div>
            <div class="sub-info">
              <strong>{{ r.patientName }}</strong>
              <span class="sub-meta">{{ r.hospital }} &middot; {{ r.units }} unit{{ r.units > 1 ? 's' : '' }} &middot; {{ r.urgency }} urgency</span>
            </div>
            <div class="sub-right">
              <span :class="['status-chip', statusClass(requestStatus(r))]">{{ requestStatus(r) }}</span>
              <span class="sub-date">{{ fmtDate(r.createdAt) }}</span>
            </div>
          </div>
        </div>

        <!-- Donations Tab -->
        <div v-if="tab === 'donations'">
          <div v-if="myDonations.length === 0" class="empty-state">
            <span class="empty-icon">💉</span>
            <p>No donation applications yet.</p>
            <RouterLink to="/donate-blood" class="empty-link">Register to donate →</RouterLink>
          </div>
          <div v-for="d in myDonations" :key="d.id" class="submission-row">
            <div class="sub-blood-badge" :class="typeClass(d.bloodType)">{{ d.bloodType }}</div>
            <div class="sub-info">
              <strong>{{ d.name }}</strong>
              <span class="sub-meta">{{ d.city }} &middot; Age {{ d.age }}</span>
            </div>
            <div class="sub-right">
              <span :class="['status-chip', statusClass(d.status)]">{{ d.status }}</span>
              <span class="sub-date">{{ fmtDate(d.createdAt) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Blood Availability Panel -->
      <aside class="availability-panel">
        <h2>Blood Availability</h2>
        <div class="blood-grid">
          <div
            v-for="type in store.BLOOD_TYPES"
            :key="type"
            :class="['blood-cell', availClass(store.inventory[type]?.units)]"
          >
            <span class="bc-type">{{ type }}</span>
            <span class="bc-units">{{ store.inventory[type]?.units ?? 0 }}</span>
            <span class="bc-label">units</span>
          </div>
        </div>
        <div class="legend">
          <span class="leg good">● Sufficient</span>
          <span class="leg low">● Low</span>
          <span class="leg critical">● Critical</span>
        </div>
        <RouterLink to="/search-blood" class="view-all-link">View details →</RouterLink>
      </aside>

    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useBloodBankStore } from '@/stores/bloodBank'

const auth = useAuthStore()
const store = useBloodBankStore()
const tab = ref('requests')

const firstName = computed(() => auth.currentUser?.name?.split(' ')[0] || 'there')

const myRequests = computed(() =>
  store.userSubmissions.filter(s => s.userId === auth.currentUser?.id && s.type === 'request')
)

const myDonations = computed(() =>
  store.userSubmissions.filter(s => s.userId === auth.currentUser?.id && s.type === 'donate')
)

function requestStatus(sub) {
  if (sub.linkedRequestId) {
    const req = store.requests.find(r => r.id === sub.linkedRequestId)
    if (req) return req.status
  }
  return 'Pending'
}

function availClass(units) {
  if (units <= 5) return 'critical'
  if (units <= 10) return 'low'
  return 'good'
}

function statusClass(status) {
  const map = {
    'Pending': 'pending', 'Pending Review': 'pending',
    'Approved': 'approved', 'Fulfilled': 'fulfilled', 'Rejected': 'rejected'
  }
  return map[status] || 'pending'
}

function typeClass(type) {
  const map = { 'O+': 'c1', 'O-': 'c2', 'A+': 'c3', 'A-': 'c4', 'B+': 'c5', 'B-': 'c6', 'AB+': 'c7', 'AB-': 'c8' }
  return map[type] || 'c1'
}

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
</script>

<style scoped>
.user-dashboard {
  max-width: 1100px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
}

/* Hero */
.hero {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 60%, #0f3460 100%);
  border-radius: 16px;
  padding: 2rem 2.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;
  color: #fff;
}

.hero-content h1 {
  margin: 0 0 0.6rem;
  font-size: 1.9rem;
}

.hero-name { color: #e74c3c; }

.hero-content p {
  margin: 0;
  color: rgba(255,255,255,.65);
  max-width: 520px;
  line-height: 1.6;
}

.hero-art { font-size: 5rem; opacity: 0.3; }

/* Action Cards */
.action-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;
}

.action-card {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  background: #fff;
  border-radius: 14px;
  padding: 1.5rem 1.25rem;
  text-decoration: none;
  box-shadow: 0 2px 10px rgba(0,0,0,.07);
  transition: transform .2s, box-shadow .2s;
  position: relative;
  overflow: hidden;
  border-left: 4px solid transparent;
}

.action-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(0,0,0,.12);
}

.action-card.blue  { border-left-color: #2980b9; }
.action-card.red   { border-left-color: #c0392b; }
.action-card.green { border-left-color: #27ae60; }
.action-card.orange{ border-left-color: #e67e22; }

.ac-icon { font-size: 2rem; }

.action-card h3 {
  margin: 0.2rem 0 0;
  font-size: 1rem;
  color: #2c3e50;
}

.action-card p {
  margin: 0;
  font-size: 0.82rem;
  color: #7f8c8d;
  line-height: 1.4;
}

.ac-arrow {
  position: absolute;
  right: 1rem;
  bottom: 1rem;
  color: #bdc3c7;
  font-size: 1.1rem;
  transition: transform .2s;
}

.action-card:hover .ac-arrow { transform: translateX(4px); }

/* Dashboard Body */
.dashboard-body {
  display: grid;
  grid-template-columns: 1fr 280px;
  gap: 1.5rem;
}

/* Activity Panel */
.activity-panel {
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 2px 10px rgba(0,0,0,.07);
  overflow: hidden;
}

.panel-header {
  padding: 1.1rem 1.25rem;
  border-bottom: 1px solid #eef0f4;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.panel-header h2 {
  margin: 0;
  font-size: 1rem;
  color: #2c3e50;
}

.tab-group { display: flex; gap: 0.4rem; }

.tab-btn {
  padding: 0.4rem 0.9rem;
  border: 1.5px solid #dce1e7;
  border-radius: 7px;
  background: #fff;
  font-size: 0.82rem;
  color: #555;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  transition: all .15s;
}

.tab-btn:hover { border-color: #c0392b; color: #c0392b; }
.tab-btn.active { background: #c0392b; border-color: #c0392b; color: #fff; font-weight: 600; }

.badge {
  background: rgba(255,255,255,.25);
  border-radius: 99px;
  padding: 0.05rem 0.45rem;
  font-size: 0.72rem;
  min-width: 18px;
  text-align: center;
}

.tab-btn:not(.active) .badge {
  background: #c0392b;
  color: #fff;
}

/* Submission rows */
.submission-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.9rem 1.25rem;
  border-bottom: 1px solid #f4f5f8;
  transition: background .15s;
}

.submission-row:last-child { border-bottom: none; }
.submission-row:hover { background: #fdf9f9; }

.sub-blood-badge {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.78rem;
  font-weight: 800;
  flex-shrink: 0;
  color: #fff;
}

.c1 { background: #e74c3c; } .c2 { background: #c0392b; }
.c3 { background: #3498db; } .c4 { background: #2980b9; }
.c5 { background: #27ae60; } .c6 { background: #1e8449; }
.c7 { background: #8e44ad; } .c8 { background: #6c3483; }

.sub-info { flex: 1; display: flex; flex-direction: column; gap: 0.2rem; }
.sub-info strong { font-size: 0.92rem; color: #2c3e50; }
.sub-meta { font-size: 0.78rem; color: #95a5a6; }

.sub-right { display: flex; flex-direction: column; align-items: flex-end; gap: 0.25rem; flex-shrink: 0; }

.status-chip {
  padding: 0.2rem 0.65rem;
  border-radius: 99px;
  font-size: 0.72rem;
  font-weight: 700;
  white-space: nowrap;
}

.status-chip.pending  { background: #fef9e7; color: #d68910; }
.status-chip.approved { background: #eafaf1; color: #1e8449; }
.status-chip.fulfilled{ background: #eaf4fb; color: #1a5276; }
.status-chip.rejected { background: #fdecea; color: #c0392b; }

.sub-date { font-size: 0.75rem; color: #bdc3c7; }

/* Empty state */
.empty-state {
  text-align: center;
  padding: 3rem 2rem;
  color: #95a5a6;
}

.empty-icon { font-size: 2.5rem; display: block; margin-bottom: 0.75rem; }
.empty-state p { margin: 0 0 1rem; font-size: 0.9rem; }

.empty-link {
  display: inline-block;
  color: #c0392b;
  font-weight: 600;
  text-decoration: none;
  font-size: 0.88rem;
}

.empty-link:hover { text-decoration: underline; }

/* Availability aside */
.availability-panel {
  background: #fff;
  border-radius: 14px;
  padding: 1.25rem;
  box-shadow: 0 2px 10px rgba(0,0,0,.07);
  height: fit-content;
}

.availability-panel h2 {
  margin: 0 0 1rem;
  font-size: 1rem;
  color: #2c3e50;
}

.blood-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.6rem;
  margin-bottom: 0.9rem;
}

.blood-cell {
  border-radius: 10px;
  padding: 0.65rem 0.5rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  border: 2px solid transparent;
}

.blood-cell.good     { background: #eafaf1; border-color: #a9dfbf; }
.blood-cell.low      { background: #fef9e7; border-color: #f9e79f; }
.blood-cell.critical { background: #fdecea; border-color: #f5b7b1; }

.bc-type   { font-size: 0.9rem; font-weight: 800; color: #2c3e50; }
.bc-units  { font-size: 1.3rem; font-weight: 700; color: #2c3e50; line-height: 1; }
.bc-label  { font-size: 0.65rem; color: #95a5a6; }

.blood-cell.critical .bc-type,
.blood-cell.critical .bc-units { color: #c0392b; }
.blood-cell.low .bc-units      { color: #d68910; }

.legend {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-bottom: 1rem;
}

.leg { font-size: 0.75rem; }
.leg.good     { color: #1e8449; }
.leg.low      { color: #d68910; }
.leg.critical { color: #c0392b; }

.view-all-link {
  display: block;
  text-align: center;
  padding: 0.6rem;
  background: #f4f6f9;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  color: #c0392b;
  text-decoration: none;
  transition: background .15s;
}

.view-all-link:hover { background: #fdecea; }

@media (max-width: 900px) {
  .action-grid { grid-template-columns: repeat(2, 1fr); }
  .dashboard-body { grid-template-columns: 1fr; }
  .availability-panel { order: -1; }
  .blood-grid { grid-template-columns: repeat(4, 1fr); }
}

@media (max-width: 500px) {
  .action-grid { grid-template-columns: 1fr; }
  .hero { flex-direction: column; text-align: center; }
  .hero-art { display: none; }
}
</style>
