<template>
  <div class="search-page">
    <div class="page-header">
      <div>
        <h1>🔍 Search Blood</h1>
        <p class="page-sub">Real-time blood availability across all types</p>
      </div>
      <RouterLink to="/request-blood" class="btn-request">🩸 Request Blood</RouterLink>
    </div>

    <!-- Filter Buttons -->
    <div class="filter-bar">
      <button
        v-for="f in ['All', ...BLOOD_TYPES]"
        :key="f"
        :class="['filter-btn', { active: filter === f }]"
        @click="filter = f"
      >{{ f }}</button>
    </div>

    <!-- Inventory Grid -->
    <div class="inventory-grid">
      <div
        v-for="type in visibleTypes"
        :key="type"
        :class="['inv-card', availClass(store.inventory[type]?.units)]"
      >
        <div class="inv-top">
          <span class="inv-type">{{ type }}</span>
          <span :class="['avail-badge', availClass(store.inventory[type]?.units)]">
            {{ availLabel(store.inventory[type]?.units) }}
          </span>
        </div>
        <div class="inv-units">{{ store.inventory[type]?.units ?? 0 }}</div>
        <div class="inv-label">units available</div>

        <!-- Availability bar -->
        <div class="inv-bar-wrap">
          <div
            class="inv-bar"
            :style="{ width: barWidth(store.inventory[type]?.units) + '%' }"
            :class="availClass(store.inventory[type]?.units)"
          ></div>
        </div>

        <!-- Compatible types -->
        <div class="compat-section">
          <span class="compat-title">You can donate to:</span>
          <div class="compat-chips">
            <span v-for="t in compatibility[type]" :key="t" class="compat-chip">{{ t }}</span>
          </div>
        </div>

        <RouterLink
          to="/request-blood"
          class="inv-req-btn"
          :class="{ disabled: (store.inventory[type]?.units ?? 0) === 0 }"
        >Request this type →</RouterLink>
      </div>
    </div>

    <!-- Compatibility Chart -->
    <div class="compat-chart-section">
      <h2>Blood Compatibility Chart</h2>
      <p class="chart-sub">Universal compatibility reference for donors and recipients</p>
      <div class="compat-table-wrap">
        <table class="compat-table">
          <thead>
            <tr>
              <th>Blood Type</th>
              <th>Can Donate To</th>
              <th>Can Receive From</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="type in BLOOD_TYPES" :key="type">
              <td><span class="bt-badge">{{ type }}</span></td>
              <td>
                <div class="chip-row">
                  <span v-for="t in compatibility[type]" :key="t" class="compat-chip sm">{{ t }}</span>
                </div>
              </td>
              <td>
                <div class="chip-row">
                  <span v-for="t in canReceiveFrom[type]" :key="t" class="compat-chip sm green">{{ t }}</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useBloodBankStore } from '@/stores/bloodBank'

const store = useBloodBankStore()
const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
const filter = ref('All')

const visibleTypes = computed(() => filter.value === 'All' ? BLOOD_TYPES : [filter.value])

// Who each type can donate to
const compatibility = {
  'O-':  ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'],
  'O+':  ['O+', 'A+', 'B+', 'AB+'],
  'A-':  ['A+', 'A-', 'AB+', 'AB-'],
  'A+':  ['A+', 'AB+'],
  'B-':  ['B+', 'B-', 'AB+', 'AB-'],
  'B+':  ['B+', 'AB+'],
  'AB-': ['AB+', 'AB-'],
  'AB+': ['AB+'],
}

// Who can donate to each type
const canReceiveFrom = {
  'O-':  ['O-'],
  'O+':  ['O+', 'O-'],
  'A-':  ['A-', 'O-'],
  'A+':  ['A+', 'A-', 'O+', 'O-'],
  'B-':  ['B-', 'O-'],
  'B+':  ['B+', 'B-', 'O+', 'O-'],
  'AB-': ['A-', 'B-', 'AB-', 'O-'],
  'AB+': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
}

function availClass(units) {
  if (units <= 5) return 'critical'
  if (units <= 10) return 'low'
  return 'good'
}

function availLabel(units) {
  if (units <= 5) return 'Critical'
  if (units <= 10) return 'Low'
  return 'Available'
}

function barWidth(units) {
  return Math.min(100, Math.round((units / 50) * 100))
}
</script>

<style scoped>
.search-page {
  max-width: 1100px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 1.75rem;
}

.page-header h1 { margin: 0 0 0.25rem; font-size: 1.75rem; color: #2c3e50; }
.page-sub { margin: 0; color: #7f8c8d; font-size: 0.9rem; }

.btn-request {
  padding: 0.65rem 1.4rem;
  background: linear-gradient(135deg, #c0392b, #922b21);
  color: #fff;
  border-radius: 9px;
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 600;
  white-space: nowrap;
  flex-shrink: 0;
  transition: opacity .2s;
}
.btn-request:hover { opacity: .88; }

/* Filters */
.filter-bar {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 1.5rem;
}

.filter-btn {
  padding: 0.45rem 1.1rem;
  border: 1.5px solid #dce1e7;
  border-radius: 99px;
  background: #fff;
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  transition: all .15s;
  color: #555;
}

.filter-btn:hover { border-color: #c0392b; color: #c0392b; }
.filter-btn.active { background: #c0392b; border-color: #c0392b; color: #fff; }

/* Inventory grid */
.inventory-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
  gap: 1rem;
  margin-bottom: 2.5rem;
}

.inv-card {
  background: #fff;
  border-radius: 14px;
  padding: 1.4rem;
  box-shadow: 0 2px 10px rgba(0,0,0,.07);
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  border-top: 4px solid transparent;
}

.inv-card.good     { border-top-color: #27ae60; }
.inv-card.low      { border-top-color: #f39c12; }
.inv-card.critical { border-top-color: #e74c3c; }

.inv-top { display: flex; align-items: center; justify-content: space-between; }

.inv-type {
  font-size: 1.5rem;
  font-weight: 800;
  color: #2c3e50;
}

.avail-badge {
  font-size: 0.72rem;
  font-weight: 700;
  padding: 0.2rem 0.6rem;
  border-radius: 99px;
}

.avail-badge.good     { background: #eafaf1; color: #1e8449; }
.avail-badge.low      { background: #fef9e7; color: #d68910; }
.avail-badge.critical { background: #fdecea; color: #c0392b; }

.inv-units { font-size: 2.5rem; font-weight: 800; color: #2c3e50; line-height: 1; }
.inv-label { font-size: 0.78rem; color: #95a5a6; margin-bottom: 0.4rem; }

.inv-bar-wrap {
  height: 6px;
  background: #eef0f4;
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 0.8rem;
}

.inv-bar {
  height: 100%;
  border-radius: 3px;
  transition: width .4s;
}

.inv-bar.good     { background: #27ae60; }
.inv-bar.low      { background: #f39c12; }
.inv-bar.critical { background: #e74c3c; }

.compat-section { margin-bottom: 0.6rem; }
.compat-title { font-size: 0.75rem; color: #95a5a6; display: block; margin-bottom: 0.35rem; }

.compat-chips { display: flex; flex-wrap: wrap; gap: 0.3rem; }

.compat-chip {
  background: #f0f4ff;
  color: #2c3e50;
  border-radius: 5px;
  padding: 0.15rem 0.45rem;
  font-size: 0.72rem;
  font-weight: 600;
}

.compat-chip.sm { font-size: 0.7rem; }
.compat-chip.green { background: #eafaf1; color: #1e8449; }

.inv-req-btn {
  display: block;
  text-align: center;
  padding: 0.55rem;
  background: #f4f6f9;
  border-radius: 8px;
  font-size: 0.82rem;
  font-weight: 600;
  color: #c0392b;
  text-decoration: none;
  margin-top: auto;
  transition: background .15s;
}

.inv-req-btn:hover:not(.disabled) { background: #fdecea; }
.inv-req-btn.disabled { color: #bdc3c7; pointer-events: none; }

/* Compat chart */
.compat-chart-section {
  background: #fff;
  border-radius: 14px;
  padding: 1.75rem;
  box-shadow: 0 2px 10px rgba(0,0,0,.07);
}

.compat-chart-section h2 { margin: 0 0 0.25rem; font-size: 1.1rem; color: #2c3e50; }
.chart-sub { margin: 0 0 1.25rem; font-size: 0.85rem; color: #95a5a6; }

.compat-table-wrap { overflow-x: auto; }

.compat-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.88rem;
}

.compat-table th {
  text-align: left;
  padding: 0.65rem 1rem;
  background: #f8f9fb;
  color: #555;
  font-weight: 600;
  border-bottom: 1px solid #eef0f4;
}

.compat-table td {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #f4f5f8;
  vertical-align: middle;
}

.compat-table tr:last-child td { border-bottom: none; }
.compat-table tr:hover td { background: #fdf9f9; }

.bt-badge {
  display: inline-block;
  background: #2c3e50;
  color: #fff;
  border-radius: 6px;
  padding: 0.2rem 0.65rem;
  font-size: 0.82rem;
  font-weight: 800;
}

.chip-row { display: flex; flex-wrap: wrap; gap: 0.35rem; }
</style>
