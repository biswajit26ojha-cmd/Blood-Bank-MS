import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '@/services/api'

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

const HOSPITALS = [
  'City General Hospital', 'St. Mercy Medical', 'University Health', 'Northside Hospital',
  'Apollo Hospital', 'AIIMS - All India Institute of Medical Sciences',
  'Fortis Memorial Research Institute', 'Max Super Speciality Hospital',
  'Manipal Hospital', 'Ruby Hall Clinic', 'Medanta - The Medicity',
  'Kokilaben Dhirubhai Ambani Hospital', 'Christian Medical College',
  'Lilavati Hospital', 'Narayana Multispeciality Hospital', 'Tata Memorial Hospital',
  'Sri Ramachandra Institute', 'Hinduja Hospital', 'Jaslok Hospital', 'Regional Medical Centre',
]

const PRESET_BANKS = [
  'Metro Blood Centre', 'Westside Community Bank', 'Regional Medical Supply',
  'City Central Blood Bank', 'North Regional Hospital', 'Pacific Regional Blood Bank',
  'Apollo Blood Centre', 'City General Blood Bank', 'National Blood Service',
  'State Blood Transfusion Council',
]

export const useBloodBankStore = defineStore('bloodBank', () => {
  // ── State ─────────────────────────────────────────────────────────────────
  const donors              = ref([])
  const inventory           = ref([])   // array of { blood_type, units, min_threshold, updated_at }
  const requests            = ref([])
  const activityLog         = ref([])
  const externalRequests    = ref([])  // both incoming + outgoing from the API

  // ── Loading flags ─────────────────────────────────────────────────────────
  const loading = ref({ donors: false, inventory: false, requests: false, activity: false, external: false })

  // ── Fetch actions ─────────────────────────────────────────────────────────
  async function fetchDonors() {
    loading.value.donors = true
    try { const d = await api.getDonors(); donors.value = d.donors } catch (e) { console.error(e) }
    finally { loading.value.donors = false }
  }

  async function fetchInventory() {
    loading.value.inventory = true
    try { const d = await api.getInventory(); inventory.value = d.inventory } catch (e) { console.error(e) }
    finally { loading.value.inventory = false }
  }

  async function fetchPublicInventory() {
    loading.value.inventory = true
    try { const d = await api.getPublicInventory(); inventory.value = d.inventory } catch (e) { console.error(e) }
    finally { loading.value.inventory = false }
  }

  async function fetchRequests() {
    loading.value.requests = true
    try { const d = await api.getRequests(); requests.value = d.requests } catch (e) { console.error(e) }
    finally { loading.value.requests = false }
  }

  async function fetchActivity() {
    loading.value.activity = true
    try { const d = await api.getActivity(100); activityLog.value = d.log } catch (e) { console.error(e) }
    finally { loading.value.activity = false }
  }

  async function fetchExternalRequests(direction) {
    loading.value.external = true
    try { const d = await api.getExternalRequests(direction); externalRequests.value = d.requests } catch (e) { console.error(e) }
    finally { loading.value.external = false }
  }

  // ── Computed ──────────────────────────────────────────────────────────────
  const totalDonors    = computed(() => donors.value.length)
  const activeDonors   = computed(() => donors.value.filter(d => d.status === 'Active').length)
  const totalUnits     = computed(() => inventory.value.reduce((s, r) => s + r.units, 0))
  const criticalStock  = computed(() => inventory.value.filter(r => r.units < r.min_threshold).map(r => r.blood_type))
  const pendingRequests = computed(() => requests.value.filter(r => r.status === 'Pending').length)

  const pendingExternalRequests = computed(() =>
    externalRequests.value.filter(r => r.direction === 'incoming' && r.status === 'Pending').length
  )

  // user_submissions are still stored locally (no backend endpoint yet)
  const userSubmissions = ref(JSON.parse(localStorage.getItem('bb_user_submissions') || '[]'))
  const pendingDonationApplications = computed(() =>
    userSubmissions.value.filter(s => s.type === 'donate' && s.status === 'Pending Review').length
  )

  // ── Donor actions ─────────────────────────────────────────────────────────
  async function addDonor(donor) {
    const { donor: created } = await api.createDonor({
      name: donor.name, blood_type: donor.bloodType, age: donor.age,
      phone: donor.phone || null, email: donor.email || null, city: donor.city || null,
      last_donation: donor.lastDonation || null, status: donor.status || 'Active'
    })
    donors.value.unshift(created)
  }

  async function updateDonor(id, updates) {
    const payload = {}
    if (updates.name        !== undefined) payload.name          = updates.name
    if (updates.bloodType   !== undefined) payload.blood_type    = updates.bloodType
    if (updates.age         !== undefined) payload.age           = updates.age
    if (updates.phone       !== undefined) payload.phone         = updates.phone
    if (updates.email       !== undefined) payload.email         = updates.email
    if (updates.city        !== undefined) payload.city          = updates.city
    if (updates.lastDonation!== undefined) payload.last_donation = updates.lastDonation
    if (updates.status      !== undefined) payload.status        = updates.status
    const { donor: updated } = await api.updateDonor(id, payload)
    const idx = donors.value.findIndex(d => d.id === id)
    if (idx !== -1) donors.value[idx] = updated
  }

  async function deleteDonor(id) {
    await api.deleteDonor(id)
    donors.value = donors.value.filter(d => d.id !== id)
  }

  async function recordDonation(donorId) {
    const { donor: updated } = await api.recordDonation(donorId)
    const idx = donors.value.findIndex(d => d.id === donorId)
    if (idx !== -1) donors.value[idx] = updated
    await fetchInventory()
  }

  // ── Inventory actions ─────────────────────────────────────────────────────
  async function adjustInventory(blood_type, action, units, reason) {
    await api.adjustInventory(blood_type, action, units, reason)
    await fetchInventory()
  }

  async function updateThreshold(blood_type, min_threshold) {
    await api.updateThreshold(blood_type, min_threshold)
    await fetchInventory()
  }

  // ── Request actions ───────────────────────────────────────────────────────
  async function addRequest(req) {
    const { request: created } = await api.createRequest({
      patient_name: req.patientName, hospital: req.hospital,
      blood_type: req.bloodType, units: req.units,
      urgency: req.urgency, notes: req.notes || null
    })
    requests.value.unshift(created)
  }

  async function updateRequestStatus(id, status) {
    const { request: updated } = await api.updateRequestStatus(id, status)
    const idx = requests.value.findIndex(r => r.id === id)
    if (idx !== -1) requests.value[idx] = updated
    if (status === 'Fulfilled') await fetchInventory()
  }

  async function deleteRequest(id) {
    await api.deleteRequest(id)
    requests.value = requests.value.filter(r => r.id !== id)
  }

  // ── External request actions ──────────────────────────────────────────────
  async function submitExternalBankRequest(form) {
    const { request: created } = await api.createExternalRequest({
      direction: 'incoming',
      bank_name: form.requestingBank, contact_name: form.contactName,
      contact_phone: form.contactPhone || null, contact_email: form.contactEmail || null,
      blood_type: form.bloodType, units: form.units,
      urgency: form.urgency, reason: form.reason || null, notes: form.notes || null
    })
    externalRequests.value.unshift(created)
    return { ok: true }
  }

  async function updateExternalBankStatus(id, status) {
    const { request: updated } = await api.updateExternalStatus(id, status)
    const idx = externalRequests.value.findIndex(r => r.id === id)
    if (idx !== -1) externalRequests.value[idx] = updated
    if (status === 'Approved') await fetchInventory()
  }

  async function submitOutgoingRequest(form) {
    const { request: created } = await api.createExternalRequest({
      direction: 'outgoing',
      bank_name: form.targetBank, contact_name: form.contactName,
      contact_phone: form.contactPhone || null, contact_email: form.contactEmail || null,
      blood_type: form.bloodType, units: form.units,
      urgency: form.urgency, reason: form.reason || null, notes: form.notes || null
    })
    externalRequests.value.unshift(created)
    return { ok: true }
  }

  async function updateOutgoingRequestStatus(id, status) {
    const { request: updated } = await api.updateExternalStatus(id, status)
    const idx = externalRequests.value.findIndex(r => r.id === id)
    if (idx !== -1) externalRequests.value[idx] = updated
    if (status === 'Fulfilled') await fetchInventory()
  }

  // ── User-facing submission helpers (still local) ──────────────────────────
  function _saveSubmissions() {
    localStorage.setItem('bb_user_submissions', JSON.stringify(userSubmissions.value))
  }

  async function submitBloodRequest({ userId, userName, patientName, bloodType, units, hospital, urgency, notes }) {
    await addRequest({ patientName, hospital, bloodType, units, urgency, notes })
    userSubmissions.value.unshift({
      id: crypto.randomUUID(), userId, userName, type: 'request',
      patientName, bloodType, units, hospital, urgency, notes,
      status: 'Submitted', createdAt: new Date().toISOString()
    })
    _saveSubmissions()
    return { ok: true }
  }

  function submitDonation({ userId, userName, name, bloodType, age, phone, email, city }) {
    userSubmissions.value.unshift({
      id: crypto.randomUUID(), userId, userName, type: 'donate',
      name, bloodType, age, phone, email, city,
      status: 'Pending Review', createdAt: new Date().toISOString()
    })
    _saveSubmissions()
    return { ok: true }
  }

  async function reviewDonationApplication(id, status) {
    const app = userSubmissions.value.find(s => s.id === id && s.type === 'donate')
    if (!app) return
    app.status = status
    app.reviewedAt = new Date().toISOString()
    if (status === 'Approved') {
      await addDonor({ name: app.name, bloodType: app.bloodType, age: app.age, phone: app.phone, email: app.email, city: app.city, lastDonation: null, status: 'Active' })
    }
    _saveSubmissions()
  }

  // ── Auto-suggest lists ────────────────────────────────────────────────────
  const allHospitals = computed(() =>
    [...new Set([...HOSPITALS, ...requests.value.map(r => r.hospital).filter(Boolean)])].sort()
  )
  const allBanks = computed(() =>
    [...new Set([...PRESET_BANKS, ...externalRequests.value.map(r => r.bank_name).filter(Boolean)])].sort()
  )

  return {
    BLOOD_TYPES, HOSPITALS,
    donors, inventory, requests, activityLog, externalRequests, userSubmissions, loading,
    totalDonors, activeDonors, totalUnits, criticalStock, pendingRequests,
    pendingExternalRequests, pendingDonationApplications,
    allHospitals, allBanks,
    fetchDonors, fetchInventory, fetchPublicInventory, fetchRequests, fetchActivity, fetchExternalRequests,
    addDonor, updateDonor, deleteDonor, recordDonation,
    adjustInventory, updateThreshold,
    addRequest, updateRequestStatus, deleteRequest,
    submitBloodRequest, submitDonation, reviewDonationApplication,
    submitExternalBankRequest, updateExternalBankStatus,
    submitOutgoingRequest, updateOutgoingRequestStatus,
  }
})
 


