<template>
  <div class="page">
    <header class="page-header">
      <div>
        <h1>Blood Inventory</h1>
        <p class="subtitle">Monitor and manage blood unit stock levels</p>
      </div>
    </header>

    <!-- Total overview -->
    <div class="overview-row">
      <div class="overview-card">
        <div class="ov-label">Total Units</div>
        <div class="ov-value">{{ store.totalUnits }}</div>
      </div>
      <div class="overview-card warn" v-if="store.criticalStock.length">
        <div class="ov-label">Critical Types</div>
        <div class="ov-value">{{ store.criticalStock.join(' · ') }}</div>
      </div>
      <div class="overview-card ok" v-else>
        <div class="ov-label">Stock Status</div>
        <div class="ov-value">All types adequate</div>
      </div>
    </div>

    <!-- Seed button when inventory is empty -->
    <div v-if="store.inventory.length === 0" class="seed-banner">
      <p>No inventory records found. Click below to initialise all blood types.</p>
      <button class="btn-seed" :disabled="seeding" @click="seedInventory">
        {{ seeding ? 'Initialising…' : '🩸 Initialise Blood Inventory' }}
      </button>
    </div>

    <!-- Blood type cards -->
    <div class="inventory-grid">
      <div
        v-for="row in store.inventory"
        :key="row.blood_type"
        class="inv-card"
        :class="stockClass(row)"
      >
        <div class="inv-header">
          <div class="inv-type">{{ row.blood_type }}</div>
          <div class="inv-status-tag" :class="stockClass(row)">
            {{ stockLabel(row) }}
          </div>
        </div>
        <div class="inv-units">{{ row.units }}</div>
        <div class="inv-units-label">units available</div>

        <div class="inv-bar-wrap">
          <div
            class="inv-bar"
            :class="stockClass(row)"
            :style="{ width: Math.min(100, (row.units / 60) * 100) + '%' }"
          ></div>
        </div>
        <div class="inv-threshold">Min threshold: {{ row.min_threshold }} units</div>

        <div class="inv-actions">
          <div class="adj-group">
            <label>Add units</label>
            <div class="qty-row">
              <input v-model.number="addQty[row.blood_type]" type="number" min="1" max="100" class="qty-input" placeholder="1" />
              <button class="btn-add" @click="handleAdd(row.blood_type)">+ Add</button>
            </div>
          </div>
          <div class="adj-group">
            <label>Deduct units</label>
            <div class="qty-row">
              <input v-model.number="deductQty[row.blood_type]" type="number" min="1" :max="row.units" class="qty-input" placeholder="1" />
              <button class="btn-deduct" @click="handleDeduct(row.blood_type, row.units)">- Deduct</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- History of adjustments -->
    <div class="card history-card">
      <h2 class="card-title">Inventory Adjustments Log</h2>
      <div class="empty-msg" v-if="adjustments.length === 0">No adjustments recorded yet.</div>
      <div class="table-wrap" v-else>
      <table class="data-table">
        <thead>
          <tr>
            <th>Time</th>
            <th>Blood Type</th>
            <th>Action</th>
            <th>Units</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="adj in adjustments" :key="adj.id">
            <td>{{ adj.time }}</td>
            <td><span class="blood-badge">{{ adj.type }}</span></td>
            <td><span class="action-tag" :class="adj.action">{{ adj.action }}</span></td>
            <td>{{ adj.units }}</td>
          </tr>
        </tbody>
      </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useBloodBankStore } from '@/stores/bloodBank'

const store = useBloodBankStore()

const addQty    = reactive({})
const deductQty = reactive({})
const seeding   = ref(false)

onMounted(() => {
  if (store.inventory.length === 0) store.fetchInventory()
})

async function seedInventory() {
  seeding.value = true
  const defaults = { 'O+': 38, 'A+': 22, 'B+': 15, 'AB+': 8, 'O-': 5, 'A-': 12, 'B-': 9, 'AB-': 3 }
  for (const [bt, units] of Object.entries(defaults)) {
    try { await store.adjustInventory(bt, 'add', units, 'Initial seed') } catch (e) { console.error(e) }
  }
  await store.fetchInventory()
  seeding.value = false
}

function now() { return new Date().toISOString().slice(0, 16).replace('T', ' ') }

const adjustments = ref([])

async function handleAdd(blood_type) {
  const qty = addQty[blood_type]
  if (!qty || qty < 1) return
  await store.adjustInventory(blood_type, 'add', qty)
  adjustments.value.unshift({ id: crypto.randomUUID(), time: now(), type: blood_type, action: 'Added', units: qty })
  addQty[blood_type] = null
}

async function handleDeduct(blood_type, available) {
  const qty = deductQty[blood_type]
  if (!qty || qty < 1) return
  if (qty > available) {
    alert(`Cannot deduct ${qty} units — only ${available} available.`)
    return
  }
  await store.adjustInventory(blood_type, 'deduct', qty)
  adjustments.value.unshift({ id: crypto.randomUUID(), time: now(), type: blood_type, action: 'Deducted', units: qty })
  deductQty[blood_type] = null
}

function stockClass(row) {
  if (row.units < row.min_threshold) return 'critical'
  if (row.units < row.min_threshold * 2) return 'low'
  return 'ok'
}

function stockLabel(row) {
  if (row.units < row.min_threshold) return 'Critical'
  if (row.units < row.min_threshold * 2) return 'Low'
  return 'Adequate'
}
</script>

<style scoped>
.page { padding: 2rem; }
.page-header { margin-bottom: 1.5rem; }
.page-header h1 { font-size: 1.75rem; color: #2c3e50; margin: 0 0 .25rem; }
.subtitle { color: #7f8c8d; font-size: .9rem; margin: 0; }

.overview-row { display: flex; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
.overview-card { background: #fff; border-radius: 10px; padding: 1rem 1.5rem; box-shadow: 0 2px 8px rgba(0,0,0,.08); min-width: 200px; }
.overview-card.warn { border-left: 4px solid #e74c3c; }
.overview-card.ok  { border-left: 4px solid #27ae60; }
.ov-label { font-size: .8rem; color: #7f8c8d; text-transform: uppercase; letter-spacing: .04em; }
.ov-value { font-size: 1.4rem; font-weight: 700; color: #2c3e50; margin-top: .25rem; }

.inventory-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1rem; margin-bottom: 1.5rem; }

.inv-card { background: #fff; border-radius: 12px; padding: 1.25rem; box-shadow: 0 2px 8px rgba(0,0,0,.08); border-top: 4px solid #ddd; }
.inv-card.ok       { border-top-color: #27ae60; }
.inv-card.low      { border-top-color: #f39c12; }
.inv-card.critical { border-top-color: #e74c3c; }

.inv-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: .5rem; }
.inv-type { font-size: 1.5rem; font-weight: 800; color: #2c3e50; }
.inv-status-tag { font-size: .72rem; font-weight: 700; padding: .2rem .55rem; border-radius: 12px; }
.inv-status-tag.ok       { background: #eafaf1; color: #1e8449; }
.inv-status-tag.low      { background: #fef9e7; color: #b7770d; }
.inv-status-tag.critical { background: #fdedec; color: #922b21; }

.inv-units { font-size: 2.4rem; font-weight: 800; color: #2c3e50; line-height: 1; }
.inv-units-label { font-size: .8rem; color: #95a5a6; margin-bottom: .75rem; }

.inv-bar-wrap { height: 8px; background: #ecf0f1; border-radius: 4px; margin-bottom: .35rem; }
.inv-bar { height: 100%; border-radius: 4px; transition: width .4s; }
.inv-bar.ok       { background: #27ae60; }
.inv-bar.low      { background: #f39c12; }
.inv-bar.critical { background: #e74c3c; }

.inv-threshold { font-size: .75rem; color: #95a5a6; margin-bottom: 1rem; }

.inv-actions { display: flex; flex-direction: column; gap: .75rem; border-top: 1px solid #f5f5f5; padding-top: .75rem; }
.adj-group label { font-size: .75rem; font-weight: 600; color: #7f8c8d; text-transform: uppercase; display: block; margin-bottom: .3rem; }
.qty-row { display: flex; gap: .5rem; }
.qty-input { flex: 1; padding: .4rem .6rem; border: 1px solid #ddd; border-radius: 6px; font-size: .9rem; }
.btn-add    { background: #27ae60; color: #fff; border: none; padding: .4rem .9rem; border-radius: 6px; font-size: .85rem; cursor: pointer; white-space: nowrap; }
.btn-deduct { background: #e74c3c; color: #fff; border: none; padding: .4rem .9rem; border-radius: 6px; font-size: .85rem; cursor: pointer; white-space: nowrap; }

.card { background: #fff; border-radius: 12px; padding: 1.25rem 1.5rem; box-shadow: 0 2px 8px rgba(0,0,0,.08); }
.history-card { margin-top: .5rem; overflow: hidden; }
.table-wrap { overflow-x: auto; }
.card-title { font-size: 1rem; font-weight: 700; color: #2c3e50; margin: 0 0 1rem; padding-bottom: .5rem; border-bottom: 1px solid #ecf0f1; }

.data-table { width: 100%; border-collapse: collapse; }
.data-table th { text-align: left; padding: .6rem 1rem; font-size: .8rem; color: #7f8c8d; text-transform: uppercase; border-bottom: 1px solid #ecf0f1; }
.data-table td { padding: .65rem 1rem; border-bottom: 1px solid #f5f5f5; font-size: .9rem; color: #2c3e50; }
.data-table tr:last-child td { border-bottom: none; }

.blood-badge { display: inline-block; background: #c0392b; color: #fff; padding: .2rem .55rem; border-radius: 4px; font-size: .8rem; font-weight: 700; }
.action-tag { display: inline-block; padding: .2rem .55rem; border-radius: 4px; font-size: .78rem; font-weight: 600; }
.action-tag.Added   { background: #eafaf1; color: #1e8449; }
.action-tag.Deducted { background: #fdedec; color: #922b21; }

.empty-msg { color: #95a5a6; font-size: .9rem; padding: .5rem 0; }

.seed-banner { background: #fff8e1; border: 1px dashed #f39c12; border-radius: 10px; padding: 1.25rem 1.5rem; text-align: center; margin-bottom: 1.5rem; }
.seed-banner p { margin: 0 0 .75rem; color: #7f6000; font-size: .95rem; }
.btn-seed { background: #c0392b; color: #fff; border: none; padding: .6rem 1.4rem; border-radius: 8px; font-size: .95rem; font-weight: 600; cursor: pointer; }
.btn-seed:disabled { opacity: .6; cursor: not-allowed; }
</style>
