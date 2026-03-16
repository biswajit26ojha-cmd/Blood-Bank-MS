<template>
  <div class="dashboard">
    <header class="page-header">
      <h1>Dashboard</h1>
      <p class="subtitle">Overview of blood bank operations — {{ today }}</p>
    </header>

    <!-- KPI Cards -->
    <div class="kpi-grid">
      <div class="kpi-card blue">
        <div class="kpi-icon">👤</div>
        <div class="kpi-info">
          <div class="kpi-value">{{ store.totalDonors }}</div>
          <div class="kpi-label">Total Donors</div>
          <div class="kpi-sub">{{ store.activeDonors }} active</div>
        </div>
      </div>
      <div class="kpi-card red">
        <div class="kpi-icon">🩸</div>
        <div class="kpi-info">
          <div class="kpi-value">{{ store.totalUnits }}</div>
          <div class="kpi-label">Blood Units Available</div>
          <div class="kpi-sub">{{ store.criticalStock.length }} types critically low</div>
        </div>
      </div>
      <div class="kpi-card orange">
        <div class="kpi-icon">📋</div>
        <div class="kpi-info">
          <div class="kpi-value">{{ store.pendingRequests }}</div>
          <div class="kpi-label">Pending Requests</div>
          <div class="kpi-sub">{{ store.requests.length }} total requests</div>
        </div>
      </div>
      <div class="kpi-card green">
        <div class="kpi-icon">✅</div>
        <div class="kpi-info">
          <div class="kpi-value">{{ fulfilledCount }}</div>
          <div class="kpi-label">Fulfilled Requests</div>
          <div class="kpi-sub">This month</div>
        </div>
      </div>
    </div>

    <div class="dashboard-body">
      <!-- Blood Inventory Summary -->
      <section class="card">
        <h2 class="card-title">Blood Inventory Summary</h2>
        <div class="inventory-grid">
          <div
            v-for="row in store.inventory"
            :key="row.blood_type"
            class="blood-type-chip"
            :class="getStockClass(row.units, row.min_threshold)"
          >
            <div class="bt-name">{{ row.blood_type }}</div>
            <div class="bt-units">{{ row.units }}<span class="bt-unit-label"> units</span></div>
            <div class="bt-bar-wrap">
              <div class="bt-bar" :style="{ width: Math.min(100, (row.units / 50) * 100) + '%' }"></div>
            </div>
          </div>
        </div>
        <div v-if="store.criticalStock.length" class="alert-banner">
          ⚠ Critical stock levels: <strong>{{ store.criticalStock.join(', ') }}</strong> — Please arrange donations!
        </div>
      </section>

      <div class="dashboard-right">
        <!-- Pending Requests -->
        <section class="card">
          <h2 class="card-title">Pending Requests</h2>
          <div v-if="pendingList.length === 0" class="empty-msg">No pending requests.</div>
          <ul class="request-list" v-else>
            <li v-for="req in pendingList" :key="req.id" class="request-item">
              <span class="urgency-dot" :class="req.urgency.toLowerCase()"></span>
              <div class="req-info">
                <div class="req-patient">{{ req.patient_name }}</div>
                <div class="req-detail">{{ req.blood_type }} · {{ req.units }} unit(s) · {{ req.hospital }}</div>
              </div>
              <span class="urgency-tag" :class="req.urgency.toLowerCase()">{{ req.urgency }}</span>
            </li>
          </ul>
          <RouterLink to="/requests" class="view-all-link">View all requests →</RouterLink>
        </section>

        <!-- Activity Log -->
        <section class="card">
          <h2 class="card-title">Recent Activity</h2>
          <ul class="activity-list">
            <li v-for="log in recentActivity" :key="log.id" class="activity-item">
              <span class="activity-icon">{{ activityIcon(log.type) }}</span>
              <div class="activity-body">
                <div class="activity-msg">{{ log.message }}</div>
                <div class="activity-time">{{ log.created_at }}</div>
              </div>
            </li>
          </ul>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useBloodBankStore } from '@/stores/bloodBank'

const store = useBloodBankStore()

onMounted(() => {
  if (store.inventory.length === 0) store.fetchInventory()
  if (store.donors.length === 0) store.fetchDonors()
  if (store.requests.length === 0) store.fetchRequests()
})

const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

const fulfilledCount = computed(() => store.requests.filter(r => r.status === 'Fulfilled').length)
const pendingList = computed(() => store.requests.filter(r => r.status === 'Pending').slice(0, 5))
const recentActivity = computed(() => store.activityLog.slice(0, 8))

function getStockClass(units, min) {
  if (units < min) return 'critical'
  if (units < min * 2) return 'low'
  return 'ok'
}

function activityIcon(type) {
  return { donation: '🩸', request: '📋', fulfill: '✅', donor: '👤' }[type] ?? '📌'
}
</script>

<style scoped>
.dashboard { padding: 2rem; }

.page-header { margin-bottom: 1.5rem; }
.page-header h1 { font-size: 1.75rem; color: #2c3e50; margin: 0 0 .25rem; }
.subtitle { color: #7f8c8d; font-size: 0.9rem; margin: 0; }

/* KPI */
.kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1.5rem; }

.kpi-card {
  border-radius: 12px;
  padding: 1.25rem 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  color: #fff;
  box-shadow: 0 4px 12px rgba(0,0,0,.1);
}
.kpi-card.blue  { background: linear-gradient(135deg, #2980b9, #1a5276); }
.kpi-card.red   { background: linear-gradient(135deg, #c0392b, #922b21); }
.kpi-card.orange{ background: linear-gradient(135deg, #e67e22, #a04000); }
.kpi-card.green { background: linear-gradient(135deg, #27ae60, #1e8449); }

.kpi-icon  { font-size: 2.5rem; }
.kpi-value { font-size: 2rem; font-weight: 700; line-height: 1; }
.kpi-label { font-size: 0.85rem; opacity: .9; margin-top: .15rem; }
.kpi-sub   { font-size: 0.75rem; opacity: .75; margin-top: .1rem; }

/* Dashboard body layout */
.dashboard-body { display: grid; grid-template-columns: 1fr 360px; gap: 1rem; }
@media (max-width: 900px) { .dashboard-body { grid-template-columns: 1fr; } }

.dashboard-right { display: flex; flex-direction: column; gap: 1rem; }

/* Card */
.card { background: #fff; border-radius: 12px; padding: 1.25rem 1.5rem; box-shadow: 0 2px 8px rgba(0,0,0,.08); }
.card-title { font-size: 1rem; font-weight: 700; color: #2c3e50; margin: 0 0 1rem; padding-bottom: .5rem; border-bottom: 1px solid #ecf0f1; }

/* Inventory grid */
.inventory-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: .75rem; }
@media (max-width: 700px) { .inventory-grid { grid-template-columns: repeat(2, 1fr); } }

.blood-type-chip { border-radius: 10px; padding: .75rem; border: 2px solid #eee; }
.blood-type-chip.ok       { border-color: #27ae60; background: #eafaf1; }
.blood-type-chip.low      { border-color: #f39c12; background: #fef9e7; }
.blood-type-chip.critical { border-color: #e74c3c; background: #fdedec; }

.bt-name  { font-size: 1.1rem; font-weight: 700; color: #2c3e50; }
.bt-units { font-size: 1.4rem; font-weight: 800; color: #34495e; margin: .2rem 0; }
.bt-unit-label { font-size: 0.7rem; font-weight: 400; color: #95a5a6; }
.bt-bar-wrap { height: 6px; background: #e0e0e0; border-radius: 3px; }
.bt-bar { height: 100%; background: #c0392b; border-radius: 3px; transition: width .4s; }
.blood-type-chip.ok .bt-bar       { background: #27ae60; }
.blood-type-chip.low .bt-bar      { background: #f39c12; }
.blood-type-chip.critical .bt-bar { background: #e74c3c; }

.alert-banner { margin-top: 1rem; background: #fdf2d0; border: 1px solid #f39c12; color: #7d5a00; border-radius: 8px; padding: .6rem 1rem; font-size: .85rem; }

/* Pending requests */
.request-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: .5rem; }
.request-item { display: flex; align-items: center; gap: .75rem; padding: .5rem .75rem; background: #f9f9f9; border-radius: 8px; }

.urgency-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.urgency-dot.critical { background: #c0392b; }
.urgency-dot.high     { background: #e74c3c; }
.urgency-dot.medium   { background: #f39c12; }
.urgency-dot.low      { background: #27ae60; }

.req-patient { font-size: .9rem; font-weight: 600; color: #2c3e50; }
.req-detail  { font-size: .78rem; color: #7f8c8d; }

.urgency-tag { margin-left: auto; font-size: .72rem; font-weight: 600; padding: .2rem .5rem; border-radius: 4px; white-space: nowrap; }
.urgency-tag.critical { background: #c0392b; color: #fff; }
.urgency-tag.high     { background: #e74c3c; color: #fff; }
.urgency-tag.medium   { background: #f39c12; color: #fff; }
.urgency-tag.low      { background: #27ae60; color: #fff; }

.view-all-link { display: inline-block; margin-top: .75rem; font-size: .85rem; color: #c0392b; text-decoration: none; }
.view-all-link:hover { text-decoration: underline; }

.empty-msg { color: #95a5a6; font-size: .9rem; padding: .5rem 0; }

/* Activity */
.activity-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: .6rem; }
.activity-item { display: flex; gap: .75rem; align-items: flex-start; }
.activity-icon { font-size: 1.25rem; flex-shrink: 0; line-height: 1.2; }
.activity-msg  { font-size: .85rem; color: #2c3e50; }
.activity-time { font-size: .75rem; color: #95a5a6; margin-top: .1rem; }
</style>
