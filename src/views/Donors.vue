<template>
  <div class="page">
    <header class="page-header">
      <div>
        <h1>Donors</h1>
        <p class="subtitle">Manage registered blood donors</p>
      </div>
      <button class="btn-primary" @click="openAddModal">+ Add Donor</button>
    </header>

    <!-- Filters -->
    <div class="toolbar">
      <input v-model="search" type="text" placeholder="Search by name, city..." class="search-input" />
      <select v-model="filterBlood" class="select-input">
        <option value="">All Blood Types</option>
        <option v-for="bt in store.BLOOD_TYPES" :key="bt">{{ bt }}</option>
      </select>
      <select v-model="filterStatus" class="select-input">
        <option value="">All Status</option>
        <option>Active</option>
        <option>Inactive</option>
      </select>
      <span class="count-badge">{{ filteredDonors.length }} donors</span>
    </div>

    <!-- Table -->
    <div class="card table-card">
      <div class="table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Blood Type</th>
            <th>Age</th>
            <th>Phone</th>
            <th>City</th>
            <th>Last Donation</th>
            <th>Total Donations</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="filteredDonors.length === 0">
            <td colspan="9" class="empty-row">No donors found.</td>
          </tr>
          <tr v-for="donor in filteredDonors" :key="donor.id">
            <td class="donor-name">{{ donor.name }}</td>
            <td><span class="blood-badge">{{ donor.bloodType }}</span></td>
            <td>{{ donor.age }}</td>
            <td>{{ donor.phone }}</td>
            <td>{{ donor.city }}</td>
            <td>{{ donor.lastDonation || '—' }}</td>
            <td class="center">{{ donor.totalDonations }}</td>
            <td>
              <span class="status-badge" :class="donor.status.toLowerCase()">{{ donor.status }}</span>
            </td>
            <td class="action-cell">
              <button class="icon-btn donate-btn" title="Record Donation" @click="handleDonate(donor)">🩸</button>
              <button class="icon-btn edit-btn" title="Edit" @click="openEditModal(donor)">✏️</button>
              <button class="icon-btn del-btn" title="Delete" @click="confirmDelete(donor)">🗑️</button>
            </td>
          </tr>
        </tbody>
      </table>
      </div>
    </div>

    <!-- Modal -->
    <Teleport to="body">
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal">
          <div class="modal-header">
            <h2>{{ editingDonor ? 'Edit Donor' : 'Add New Donor' }}</h2>
            <button class="close-btn" @click="closeModal">✕</button>
          </div>
          <form class="modal-form" @submit.prevent="submitDonor">
            <div class="form-grid">
              <div class="form-group">
                <label>Full Name *</label>
                <input v-model="form.name" type="text" required placeholder="e.g. John Doe" />
              </div>
              <div class="form-group">
                <label>Blood Type *</label>
                <select v-model="form.bloodType" required>
                  <option value="" disabled>Select</option>
                  <option v-for="bt in store.BLOOD_TYPES" :key="bt">{{ bt }}</option>
                </select>
              </div>
              <div class="form-group">
                <label>Age *</label>
                <input v-model.number="form.age" type="number" min="18" max="65" required />
              </div>
              <div class="form-group">
                <label>Phone</label>
                <input v-model="form.phone" type="text" placeholder="e.g. 555-0100" />
              </div>
              <div class="form-group">
                <label>Email</label>
                <input v-model="form.email" type="email" placeholder="e.g. john@email.com" />
              </div>
              <div class="form-group">
                <label>City</label>
                <input v-model="form.city" type="text" placeholder="e.g. New York" />
              </div>
              <div class="form-group">
                <label>Last Donation Date</label>
                <input v-model="form.lastDonation" type="date" />
              </div>
              <div class="form-group">
                <label>Status</label>
                <select v-model="form.status">
                  <option>Active</option>
                  <option>Inactive</option>
                </select>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn-secondary" @click="closeModal">Cancel</button>
              <button type="submit" class="btn-primary">{{ editingDonor ? 'Save Changes' : 'Add Donor' }}</button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- Confirm Delete -->
    <Teleport to="body">
      <div v-if="deletingDonor" class="modal-overlay" @click.self="deletingDonor = null">
        <div class="modal modal-sm">
          <div class="modal-header">
            <h2>Confirm Delete</h2>
            <button class="close-btn" @click="deletingDonor = null">✕</button>
          </div>
          <p class="confirm-msg">Are you sure you want to remove <strong>{{ deletingDonor.name }}</strong>?</p>
          <div class="modal-footer">
            <button class="btn-secondary" @click="deletingDonor = null">Cancel</button>
            <button class="btn-danger" @click="doDelete">Delete</button>
          </div>
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
const filterBlood = ref('')
const filterStatus = ref('')

const filteredDonors = computed(() => {
  return store.donors.filter(d => {
    const q = search.value.toLowerCase()
    const matchSearch = !q || d.name.toLowerCase().includes(q) || d.city.toLowerCase().includes(q)
    const matchBlood = !filterBlood.value || d.bloodType === filterBlood.value
    const matchStatus = !filterStatus.value || d.status === filterStatus.value
    return matchSearch && matchBlood && matchStatus
  })
})

// Modal state
const showModal = ref(false)
const editingDonor = ref(null)
const deletingDonor = ref(null)

const blankForm = () => ({ name: '', bloodType: '', age: '', phone: '', email: '', city: '', lastDonation: '', status: 'Active' })
const form = reactive(blankForm())

function openAddModal() {
  Object.assign(form, blankForm())
  editingDonor.value = null
  showModal.value = true
}

function openEditModal(donor) {
  Object.assign(form, { ...donor })
  editingDonor.value = donor
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editingDonor.value = null
}

function submitDonor() {
  if (editingDonor.value) {
    store.updateDonor(editingDonor.value.id, { ...form })
  } else {
    store.addDonor({ ...form })
  }
  closeModal()
}

function confirmDelete(donor) {
  deletingDonor.value = donor
}

function doDelete() {
  store.deleteDonor(deletingDonor.value.id)
  deletingDonor.value = null
}

function handleDonate(donor) {
  if (confirm(`Record a blood donation for ${donor.name} (${donor.bloodType})?`)) {
    store.recordDonation(donor.id, donor.bloodType)
  }
}
</script>

<style scoped>
.page { padding: 2rem; }

.page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; }
.page-header h1 { font-size: 1.75rem; color: #2c3e50; margin: 0 0 .25rem; }
.subtitle { color: #7f8c8d; font-size: .9rem; margin: 0; }

.toolbar { display: flex; gap: .75rem; align-items: center; flex-wrap: wrap; margin-bottom: 1rem; }
.search-input { flex: 1; min-width: 200px; padding: .5rem .75rem; border: 1px solid #ddd; border-radius: 6px; font-size: .9rem; }
.select-input { padding: .5rem .75rem; border: 1px solid #ddd; border-radius: 6px; font-size: .9rem; background: #fff; }
.count-badge { background: #ecf0f1; padding: .3rem .75rem; border-radius: 20px; font-size: .8rem; color: #7f8c8d; }

.card { background: #fff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,.08); }
.table-card { overflow: hidden; }
.table-wrap { overflow-x: auto; }

.data-table { width: 100%; border-collapse: collapse; }
.data-table th { text-align: left; padding: .75rem 1rem; font-size: .8rem; color: #7f8c8d; text-transform: uppercase; letter-spacing: .05em; border-bottom: 1px solid #ecf0f1; white-space: nowrap; }
.data-table td { padding: .75rem 1rem; border-bottom: 1px solid #f5f5f5; font-size: .9rem; color: #2c3e50; vertical-align: middle; }
.data-table tr:last-child td { border-bottom: none; }
.data-table tr:hover td { background: #fafafa; }

.donor-name { font-weight: 600; }
.center { text-align: center; }

.blood-badge { display: inline-block; background: #c0392b; color: #fff; padding: .2rem .55rem; border-radius: 4px; font-size: .8rem; font-weight: 700; }
.status-badge { display: inline-block; padding: .2rem .6rem; border-radius: 20px; font-size: .75rem; font-weight: 600; }
.status-badge.active { background: #eafaf1; color: #1e8449; }
.status-badge.inactive { background: #f5f5f5; color: #7f8c8d; }

.action-cell { white-space: nowrap; min-width: 100px; }
.icon-btn { background: none; border: none; cursor: pointer; font-size: .9rem; padding: .2rem .4rem; border-radius: 4px; transition: background .2s; }
.icon-btn:hover { background: #ecf0f1; }

.empty-row { text-align: center; color: #95a5a6; padding: 2rem; }

/* Buttons */
.btn-primary  { background: #c0392b; color: #fff; border: none; padding: .55rem 1.25rem; border-radius: 6px; font-size: .9rem; font-weight: 600; cursor: pointer; }
.btn-primary:hover { background: #a93226; }
.btn-secondary { background: #ecf0f1; color: #2c3e50; border: none; padding: .55rem 1.25rem; border-radius: 6px; font-size: .9rem; cursor: pointer; }
.btn-danger { background: #e74c3c; color: #fff; border: none; padding: .55rem 1.25rem; border-radius: 6px; font-size: .9rem; cursor: pointer; }

/* Modal */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal { background: #fff; border-radius: 14px; width: 600px; max-width: 95vw; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 40px rgba(0,0,0,.2); }
.modal-sm { width: 420px; }

.modal-header { display: flex; justify-content: space-between; align-items: center; padding: 1.25rem 1.5rem; border-bottom: 1px solid #ecf0f1; }
.modal-header h2 { margin: 0; font-size: 1.1rem; color: #2c3e50; }
.close-btn { background: none; border: none; font-size: 1.1rem; cursor: pointer; color: #7f8c8d; padding: .2rem; }

.modal-form { padding: 1.5rem; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
@media (max-width: 500px) { .form-grid { grid-template-columns: 1fr; } }
.form-group { display: flex; flex-direction: column; gap: .35rem; }
.form-group label { font-size: .8rem; font-weight: 600; color: #7f8c8d; text-transform: uppercase; letter-spacing: .03em; }
.form-group input, .form-group select { padding: .5rem .75rem; border: 1px solid #ddd; border-radius: 6px; font-size: .9rem; }
.form-group input:focus, .form-group select:focus { outline: none; border-color: #c0392b; }

.modal-footer { display: flex; gap: .75rem; justify-content: flex-end; padding: 1rem 1.5rem; border-top: 1px solid #ecf0f1; }
.confirm-msg { padding: 1.25rem 1.5rem; color: #2c3e50; font-size: .95rem; margin: 0; }
</style>
