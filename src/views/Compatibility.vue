<template>
  <div class="page">
    <header class="page-header">
      <h1>Blood Type Compatibility</h1>
      <p class="subtitle">Reference guide for blood type compatibility in transfusions and donations</p>
    </header>

    <!-- Compatibility Table -->
    <div class="card">
      <h2 class="card-title">Transfusion Compatibility Matrix</h2>
      <div class="table-scroll">
        <table class="compat-table">
          <thead>
            <tr>
              <th class="corner">Donor ↓ / Recipient →</th>
              <th v-for="rt in bloodTypes" :key="rt" class="recipient-header">
                <span class="bt-chip recipient">{{ rt }}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="donor in bloodTypes" :key="donor">
              <td class="donor-cell">
                <span class="bt-chip donor">{{ donor }}</span>
              </td>
              <td
                v-for="recipient in bloodTypes"
                :key="recipient"
                class="compat-cell"
                :class="isCompatible(donor, recipient) ? 'yes' : 'no'"
              >
                {{ isCompatible(donor, recipient) ? '✓' : '✗' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="legend">
        <span class="legend-item yes">✓ Compatible</span>
        <span class="legend-item no">✗ Incompatible</span>
      </div>
    </div>

    <!-- Quick Lookup -->
    <div class="card lookup-card">
      <h2 class="card-title">Quick Compatibility Lookup</h2>
      <div class="lookup-row">
        <div class="lookup-group">
          <label>Donor Blood Type</label>
          <select v-model="lookupDonor" class="select-input">
            <option value="" disabled>Select</option>
            <option v-for="bt in bloodTypes" :key="bt">{{ bt }}</option>
          </select>
        </div>
        <div class="lookup-arrow">→</div>
        <div class="lookup-group">
          <label>Recipient Blood Type</label>
          <select v-model="lookupRecipient" class="select-input">
            <option value="" disabled>Select</option>
            <option v-for="bt in bloodTypes" :key="bt">{{ bt }}</option>
          </select>
        </div>
        <div class="lookup-result" v-if="lookupDonor && lookupRecipient">
          <span v-if="isCompatible(lookupDonor, lookupRecipient)" class="result-yes">✓ Compatible</span>
          <span v-else class="result-no">✗ Incompatible</span>
        </div>
      </div>
    </div>

    <!-- Blood type info cards -->
    <h2 class="section-title">Blood Type Profiles</h2>
    <div class="profile-grid">
      <div v-for="bt in bloodTypeProfiles" :key="bt.type" class="profile-card">
        <div class="profile-type">{{ bt.type }}</div>
        <div class="profile-info">
          <div class="profile-section">
            <div class="profile-label">Can Donate To</div>
            <div class="profile-chips">
              <span v-for="t in bt.donateTo" :key="t" class="mini-chip donate">{{ t }}</span>
            </div>
          </div>
          <div class="profile-section">
            <div class="profile-label">Can Receive From</div>
            <div class="profile-chips">
              <span v-for="t in bt.receiveFrom" :key="t" class="mini-chip receive">{{ t }}</span>
            </div>
          </div>
          <div class="profile-freq">{{ bt.frequency }}</div>
        </div>
      </div>
    </div>

    <!-- Key facts -->
    <div class="card facts-card">
      <h2 class="card-title">Key Facts</h2>
      <div class="facts-grid">
        <div class="fact">
          <div class="fact-icon">🌍</div>
          <div class="fact-text"><strong>Universal Donor:</strong> O- can donate red blood cells to any blood type.</div>
        </div>
        <div class="fact">
          <div class="fact-icon">🎯</div>
          <div class="fact-text"><strong>Universal Recipient:</strong> AB+ can receive red blood cells from all blood types.</div>
        </div>
        <div class="fact">
          <div class="fact-icon">💉</div>
          <div class="fact-text"><strong>Plasma Donation:</strong> AB plasma is universal and can be given to all blood types.</div>
        </div>
        <div class="fact">
          <div class="fact-icon">📊</div>
          <div class="fact-text"><strong>Most Common:</strong> O+ is the most common blood type (~38% of the population).</div>
        </div>
        <div class="fact">
          <div class="fact-icon">🔬</div>
          <div class="fact-text"><strong>Rarest:</strong> AB- is the rarest blood type (~1% of the population).</div>
        </div>
        <div class="fact">
          <div class="fact-icon">⏱</div>
          <div class="fact-text"><strong>Donation interval:</strong> Whole blood can be donated every 56 days (8 weeks).</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

// Standard RBC transfusion compatibility
const compatibilityMap = {
  'O-':  ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
  'O+':  ['O+', 'A+', 'B+', 'AB+'],
  'A-':  ['A-', 'A+', 'AB-', 'AB+'],
  'A+':  ['A+', 'AB+'],
  'B-':  ['B-', 'B+', 'AB-', 'AB+'],
  'B+':  ['B+', 'AB+'],
  'AB-': ['AB-', 'AB+'],
  'AB+': ['AB+'],
}

function isCompatible(donor, recipient) {
  return compatibilityMap[donor]?.includes(recipient) ?? false
}

const lookupDonor = ref('')
const lookupRecipient = ref('')

const bloodTypeProfiles = computed(() => bloodTypes.map(type => ({
  type,
  donateTo: bloodTypes.filter(r => isCompatible(type, r)),
  receiveFrom: bloodTypes.filter(d => isCompatible(d, type)),
  frequency: {
    'O+': '~38% of population', 'O-': '~7% of population',
    'A+': '~34% of population', 'A-': '~6% of population',
    'B+': '~9% of population',  'B-': '~2% of population',
    'AB+': '~3% of population', 'AB-': '~1% of population',
  }[type]
})))
</script>

<style scoped>
.page { padding: 2rem; }
.page-header { margin-bottom: 1.5rem; }
.page-header h1 { font-size: 1.75rem; color: #2c3e50; margin: 0 0 .25rem; }
.subtitle { color: #7f8c8d; font-size: .9rem; margin: 0; }
.section-title { font-size: 1.1rem; font-weight: 700; color: #2c3e50; margin: 1.5rem 0 1rem; }

.card { background: #fff; border-radius: 12px; padding: 1.25rem 1.5rem; box-shadow: 0 2px 8px rgba(0,0,0,.08); margin-bottom: 1.25rem; }
.card-title { font-size: 1rem; font-weight: 700; color: #2c3e50; margin: 0 0 1rem; padding-bottom: .5rem; border-bottom: 1px solid #ecf0f1; }

/* Compat table */
.table-scroll { overflow-x: auto; }
.compat-table { border-collapse: collapse; min-width: 600px; }
.corner { background: #f8f9fa; color: #7f8c8d; font-size: .8rem; padding: .75rem 1rem; text-align: left; }
.recipient-header { text-align: center; padding: .5rem .75rem; }
.donor-cell { padding: .5rem .75rem; }
.compat-cell { text-align: center; padding: .55rem .75rem; font-size: 1rem; font-weight: 700; border: 1px solid #f0f0f0; }
.compat-cell.yes { background: #eafaf1; color: #1e8449; }
.compat-cell.no  { background: #fdedec; color: #c0392b; }

.bt-chip { display: inline-block; padding: .2rem .55rem; border-radius: 4px; font-size: .85rem; font-weight: 700; }
.bt-chip.recipient { background: #d6eaf8; color: #1a5276; }
.bt-chip.donor     { background: #c0392b; color: #fff; }

.legend { display: flex; gap: 1.5rem; margin-top: 1rem; }
.legend-item { font-size: .85rem; font-weight: 600; }
.legend-item.yes { color: #1e8449; }
.legend-item.no  { color: #c0392b; }

/* Lookup */
.lookup-card { }
.lookup-row { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; }
.lookup-group { display: flex; flex-direction: column; gap: .35rem; }
.lookup-group label { font-size: .78rem; font-weight: 600; color: #7f8c8d; text-transform: uppercase; letter-spacing: .03em; }
.select-input { padding: .5rem .75rem; border: 1px solid #ddd; border-radius: 6px; font-size: .9rem; background: #fff; min-width: 140px; }
.lookup-arrow { font-size: 1.5rem; color: #95a5a6; margin-top: 1.2rem; }
.lookup-result { margin-top: 1.2rem; }
.result-yes { color: #1e8449; font-size: 1.1rem; font-weight: 700; background: #eafaf1; padding: .5rem 1rem; border-radius: 8px; }
.result-no  { color: #922b21; font-size: 1.1rem; font-weight: 700; background: #fdedec; padding: .5rem 1rem; border-radius: 8px; }

/* Profiles */
.profile-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 1rem; margin-bottom: 1.25rem; }
.profile-card { background: #fff; border-radius: 12px; padding: 1.25rem; box-shadow: 0 2px 8px rgba(0,0,0,.08); display: flex; gap: 1rem; align-items: flex-start; }
.profile-type { font-size: 2rem; font-weight: 800; color: #c0392b; min-width: 48px; }
.profile-info { flex: 1; }
.profile-section { margin-bottom: .5rem; }
.profile-label { font-size: .72rem; font-weight: 700; color: #7f8c8d; text-transform: uppercase; letter-spacing: .04em; margin-bottom: .25rem; }
.profile-chips { display: flex; flex-wrap: wrap; gap: .25rem; }
.mini-chip { font-size: .72rem; font-weight: 700; padding: .15rem .4rem; border-radius: 4px; }
.mini-chip.donate  { background: #fdebd0; color: #784212; }
.mini-chip.receive { background: #d5f5e3; color: #1e8449; }
.profile-freq { font-size: .75rem; color: #95a5a6; margin-top: .5rem; }

/* Facts */
.facts-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1rem; }
.fact { display: flex; gap: .75rem; align-items: flex-start; }
.fact-icon { font-size: 1.5rem; flex-shrink: 0; }
.fact-text { font-size: .85rem; color: #2c3e50; line-height: 1.5; }
</style>
