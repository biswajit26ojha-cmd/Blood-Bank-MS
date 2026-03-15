import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

const HOSPITALS = [
  'City General Hospital',
  'St. Mercy Medical',
  'University Health',
  'Northside Hospital',
  'Apollo Hospital',
  'AIIMS - All India Institute of Medical Sciences',
  'Fortis Memorial Research Institute',
  'Max Super Speciality Hospital',
  'Manipal Hospital',
  'Ruby Hall Clinic',
  'Medanta - The Medicity',
  'Kokilaben Dhirubhai Ambani Hospital',
  'Christian Medical College',
  'Lilavati Hospital',
  'Narayana Multispeciality Hospital',
  'Tata Memorial Hospital',
  'Sri Ramachandra Institute',
  'Hinduja Hospital',
  'Jaslok Hospital',
  'Regional Medical Centre',
]

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

export const useBloodBankStore = defineStore('bloodBank', () => {
  // ── Donors ──────────────────────────────────────────────────────────────
  const donors = ref([
    { id: generateId(), name: 'Alice Johnson', bloodType: 'O+', age: 28, phone: '555-0101', email: 'alice@example.com', city: 'New York', lastDonation: '2025-11-10', totalDonations: 5, status: 'Active' },
    { id: generateId(), name: 'Bob Martinez', bloodType: 'A+', age: 34, phone: '555-0102', email: 'bob@example.com', city: 'Chicago', lastDonation: '2025-12-05', totalDonations: 3, status: 'Active' },
    { id: generateId(), name: 'Carol White', bloodType: 'B-', age: 45, phone: '555-0103', email: 'carol@example.com', city: 'Los Angeles', lastDonation: '2025-09-20', totalDonations: 8, status: 'Active' },
    { id: generateId(), name: 'David Lee', bloodType: 'AB+', age: 22, phone: '555-0104', email: 'david@example.com', city: 'Houston', lastDonation: '2026-01-15', totalDonations: 2, status: 'Active' },
    { id: generateId(), name: 'Emma Davis', bloodType: 'O-', age: 31, phone: '555-0105', email: 'emma@example.com', city: 'Phoenix', lastDonation: '2025-10-30', totalDonations: 6, status: 'Inactive' },
    { id: generateId(), name: 'Frank Wilson', bloodType: 'A-', age: 39, phone: '555-0106', email: 'frank@example.com', city: 'Philadelphia', lastDonation: '2026-02-01', totalDonations: 4, status: 'Active' },
  ])

  // ── Inventory ────────────────────────────────────────────────────────────
  const inventory = ref(
    BLOOD_TYPES.reduce((acc, type) => {
      acc[type] = { units: Math.floor(Math.random() * 40) + 5, minThreshold: 10 }
      return acc
    }, {})
  )
  // Fix deterministic seed values for demo
  inventory.value['O+'].units = 38
  inventory.value['A+'].units = 22
  inventory.value['B+'].units = 15
  inventory.value['AB+'].units = 8
  inventory.value['O-'].units = 6
  inventory.value['A-'].units = 12
  inventory.value['B-'].units = 4
  inventory.value['AB-'].units = 3

  // ── Blood Requests ───────────────────────────────────────────────────────
  const requests = ref([
    { id: generateId(), patientName: 'John Smith', hospital: 'City General Hospital', bloodType: 'O+', units: 2, urgency: 'High', status: 'Pending', requestDate: '2026-03-14', notes: 'Surgery scheduled for tomorrow' },
    { id: generateId(), patientName: 'Mary Brown', hospital: 'St. Mercy Medical', bloodType: 'A+', units: 1, urgency: 'Medium', status: 'Approved', requestDate: '2026-03-13', notes: 'Post-operative care' },
    { id: generateId(), patientName: 'Tom Harris', hospital: 'University Health', bloodType: 'B-', units: 3, urgency: 'Critical', status: 'Fulfilled', requestDate: '2026-03-12', notes: 'Emergency transfusion' },
    { id: generateId(), patientName: 'Sara Wilson', hospital: 'Northside Hospital', bloodType: 'AB+', units: 2, urgency: 'Low', status: 'Pending', requestDate: '2026-03-15', notes: 'Elective procedure' },
  ])

  // ── Activity Log ─────────────────────────────────────────────────────────
  const activityLog = ref([
    { id: generateId(), type: 'donation', message: 'Frank Wilson donated A- (1 unit)', time: '2026-02-01 10:30' },
    { id: generateId(), type: 'request', message: 'New blood request from City General Hospital (O+, 2 units)', time: '2026-03-14 09:15' },
    { id: generateId(), type: 'fulfill', message: 'Emergency request fulfilled — B- (3 units) to University Health', time: '2026-03-12 14:22' },
    { id: generateId(), type: 'donor', message: 'New donor registered: David Lee (AB+)', time: '2026-01-15 11:00' },
  ])

  // ── User Submissions ──────────────────────────────────────────────────────
  const userSubmissions = ref(JSON.parse(localStorage.getItem('bb_user_submissions') || '[]'))
  watch(userSubmissions, val => localStorage.setItem('bb_user_submissions', JSON.stringify(val)), { deep: true })

  // ── External Bank Requests ─────────────────────────────────────────────
  const externalBankRequests = ref(JSON.parse(localStorage.getItem('bb_external_requests') || JSON.stringify([
    { id: generateId(), requestingBank: 'Metro Blood Centre', contactName: 'Dr. Priya Sharma', contactPhone: '555-2001', contactEmail: 'priya@metrobc.org', bloodType: 'O-', units: 4, urgency: 'Critical', reason: 'Mass casualty incident', status: 'Pending', requestDate: '2026-03-14', resolvedDate: null, notes: 'Multi-vehicle accident victims' },
    { id: generateId(), requestingBank: 'Westside Community Bank', contactName: 'Mr. James Cole', contactPhone: '555-3002', contactEmail: 'jcole@wcb.org', bloodType: 'AB+', units: 2, urgency: 'High', reason: 'Inventory shortage', status: 'Approved', requestDate: '2026-03-12', resolvedDate: '2026-03-13', notes: 'Chronic shortage in AB+ type' },
    { id: generateId(), requestingBank: 'Regional Medical Supply', contactName: 'Ms. Laura Kim', contactPhone: '555-4003', contactEmail: 'lkim@rms.org', bloodType: 'B-', units: 3, urgency: 'Medium', reason: 'Scheduled surgeries next week', status: 'Declined', requestDate: '2026-03-10', resolvedDate: '2026-03-11', notes: '' },
  ])))
  watch(externalBankRequests, val => localStorage.setItem('bb_external_requests', JSON.stringify(val)), { deep: true })

  const pendingExternalRequests = computed(() => externalBankRequests.value.filter(r => r.status === 'Pending').length)

  // ── Outgoing Bank Requests (we request FROM other banks) ───────────────
  const outgoingBankRequests = ref(JSON.parse(localStorage.getItem('bb_outgoing_requests') || JSON.stringify([
    { id: generateId(), targetBank: 'City Central Blood Bank', contactName: 'Dr. Anil Verma', contactPhone: '555-7001', contactEmail: 'anil@ccbb.org', bloodType: 'O+', units: 5, urgency: 'High', reason: 'Emergency surgery backlog', notes: '', status: 'Pending', requestDate: '2026-03-14', fulfilledDate: null },
    { id: generateId(), targetBank: 'North Regional Hospital', contactName: 'Ms. Sunita Roy', contactPhone: '555-8002', contactEmail: 'sroy@nrh.org', bloodType: 'A-', units: 3, urgency: 'Medium', reason: 'Stock replenishment', notes: 'Needed before next week', status: 'Fulfilled', requestDate: '2026-03-10', fulfilledDate: '2026-03-12' },
  ])))
  watch(outgoingBankRequests, val => localStorage.setItem('bb_outgoing_requests', JSON.stringify(val)), { deep: true })

  // ── Computed ─────────────────────────────────────────────────────────────
  const totalDonors = computed(() => donors.value.length)
  const activeDonors = computed(() => donors.value.filter(d => d.status === 'Active').length)
  const totalUnits = computed(() => Object.values(inventory.value).reduce((sum, v) => sum + v.units, 0))
  const criticalStock = computed(() => Object.entries(inventory.value).filter(([, v]) => v.units < v.minThreshold).map(([type]) => type))
  const pendingRequests = computed(() => requests.value.filter(r => r.status === 'Pending').length)

  // ── Donor Actions ─────────────────────────────────────────────────────────
  function addDonor(donor) {
    const newDonor = { id: generateId(), totalDonations: 0, ...donor }
    donors.value.unshift(newDonor)
    logActivity('donor', `New donor registered: ${donor.name} (${donor.bloodType})`)
  }

  function updateDonor(id, updates) {
    const idx = donors.value.findIndex(d => d.id === id)
    if (idx !== -1) donors.value[idx] = { ...donors.value[idx], ...updates }
  }

  function deleteDonor(id) {
    const donor = donors.value.find(d => d.id === id)
    donors.value = donors.value.filter(d => d.id !== id)
    if (donor) logActivity('donor', `Donor removed: ${donor.name}`)
  }

  function recordDonation(donorId, bloodType) {
    const donor = donors.value.find(d => d.id === donorId)
    if (!donor) return
    donor.lastDonation = new Date().toISOString().slice(0, 10)
    donor.totalDonations++
    addInventory(bloodType, 1)
    logActivity('donation', `${donor.name} donated ${bloodType} (1 unit)`)
  }

  // ── Inventory Actions ─────────────────────────────────────────────────────
  function addInventory(type, units) {
    if (inventory.value[type]) inventory.value[type].units += units
  }

  function deductInventory(type, units) {
    if (inventory.value[type]) {
      inventory.value[type].units = Math.max(0, inventory.value[type].units - units)
    }
  }

  // ── Request Actions ────────────────────────────────────────────────────────
  function addRequest(req) {
    requests.value.unshift({ id: generateId(), status: 'Pending', requestDate: new Date().toISOString().slice(0, 10), ...req })
    logActivity('request', `New blood request from ${req.hospital} (${req.bloodType}, ${req.units} units)`)
  }

  function updateRequestStatus(id, status) {
    const req = requests.value.find(r => r.id === id)
    if (!req) return
    req.status = status
    if (status === 'Fulfilled') {
      deductInventory(req.bloodType, req.units)
      logActivity('fulfill', `Request fulfilled — ${req.bloodType} (${req.units} units) to ${req.hospital}`)
    }
  }

  function deleteRequest(id) {
    requests.value = requests.value.filter(r => r.id !== id)
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  function logActivity(type, message) {
    const now = new Date()
    const time = now.toISOString().slice(0, 16).replace('T', ' ')
    activityLog.value.unshift({ id: generateId(), type, message, time })
    if (activityLog.value.length > 50) activityLog.value.pop()
  }

  // ── User-Facing Submissions ───────────────────────────────────────────────
  function submitBloodRequest({ userId, userName, patientName, bloodType, units, hospital, urgency, notes }) {
    const reqId = generateId()
    requests.value.unshift({
      id: reqId, status: 'Pending',
      requestDate: new Date().toISOString().slice(0, 10),
      patientName, hospital, bloodType, units, urgency, notes
    })
    userSubmissions.value.unshift({
      id: generateId(), userId, userName, type: 'request',
      patientName, bloodType, units, hospital, urgency, notes,
      linkedRequestId: reqId, createdAt: new Date().toISOString()
    })
    logActivity('request', `New blood request from ${hospital} (${bloodType}, ${units} units)`)
    return { ok: true }
  }

  function submitDonation({ userId, userName, name, bloodType, age, phone, email, city }) {
    userSubmissions.value.unshift({
      id: generateId(), userId, userName, type: 'donate',
      name, bloodType, age, phone, email, city,
      status: 'Pending Review', createdAt: new Date().toISOString()
    })
    logActivity('donor', `Donation application received from ${name} (${bloodType})`)
    return { ok: true }
  }

  function reviewDonationApplication(id, status) {
    const app = userSubmissions.value.find(s => s.id === id && s.type === 'donate')
    if (!app) return
    app.status = status
    app.reviewedAt = new Date().toISOString()
    if (status === 'Approved') {
      addDonor({
        name: app.name, bloodType: app.bloodType,
        age: app.age, phone: app.phone, email: app.email,
        city: app.city, lastDonation: null, status: 'Active'
      })
      logActivity('donor', `Donation application approved: ${app.name} added as donor (${app.bloodType})`)
    } else if (status === 'Rejected') {
      logActivity('donor', `Donation application rejected: ${app.name} (${app.bloodType})`)
    }
  }

  const pendingDonationApplications = computed(() =>
    userSubmissions.value.filter(s => s.type === 'donate' && s.status === 'Pending Review').length
  )

  // ── External Bank Request Actions ──────────────────────────────────────
  function submitExternalBankRequest({ requestingBank, contactName, contactPhone, contactEmail, bloodType, units, urgency, reason, notes }) {
    externalBankRequests.value.unshift({
      id: generateId(),
      requestingBank, contactName, contactPhone, contactEmail,
      bloodType, units, urgency, reason, notes,
      status: 'Pending',
      requestDate: new Date().toISOString().slice(0, 10),
      resolvedDate: null
    })
    logActivity('request', `External bank request: ${requestingBank} needs ${units} units of ${bloodType} (${urgency})`)
    return { ok: true }
  }

  function updateExternalBankStatus(id, status) {
    const req = externalBankRequests.value.find(r => r.id === id)
    if (!req) return
    req.status = status
    req.resolvedDate = new Date().toISOString().slice(0, 10)
    if (status === 'Approved') {
      deductInventory(req.bloodType, req.units)
      logActivity('fulfill', `External bank request approved: ${req.units} units of ${req.bloodType} to ${req.requestingBank}`)
    } else if (status === 'Declined') {
      logActivity('request', `External bank request declined: ${req.requestingBank} (${req.bloodType})`)
    }
  }

  // ── Outgoing Request Actions ───────────────────────────────────────────
  function submitOutgoingRequest({ targetBank, contactName, contactPhone, contactEmail, bloodType, units, urgency, reason, notes }) {
    outgoingBankRequests.value.unshift({
      id: generateId(),
      targetBank, contactName, contactPhone, contactEmail,
      bloodType, units, urgency, reason, notes,
      status: 'Pending',
      requestDate: new Date().toISOString().slice(0, 10),
      fulfilledDate: null
    })
    logActivity('request', `Outgoing request sent to ${targetBank}: ${units} units of ${bloodType} (${urgency})`)
    return { ok: true }
  }

  function updateOutgoingRequestStatus(id, status) {
    const req = outgoingBankRequests.value.find(r => r.id === id)
    if (!req) return
    req.status = status
    if (status === 'Fulfilled') {
      req.fulfilledDate = new Date().toISOString().slice(0, 10)
      addInventory(req.bloodType, req.units)
      logActivity('fulfill', `Outgoing request fulfilled: received ${req.units} units of ${req.bloodType} from ${req.targetBank}`)
    } else if (status === 'Cancelled') {
      req.fulfilledDate = new Date().toISOString().slice(0, 10)
      logActivity('request', `Outgoing request cancelled: ${req.targetBank} (${req.bloodType})`)
    }
  }

  return {
    BLOOD_TYPES,
    donors, inventory, requests, activityLog, userSubmissions, externalBankRequests, outgoingBankRequests,
    totalDonors, activeDonors, totalUnits, criticalStock, pendingRequests, pendingExternalRequests, pendingDonationApplications,
    HOSPITALS, allHospitals: computed(() => [...new Set([...HOSPITALS, ...requests.value.map(r => r.hospital).filter(Boolean)])].sort()),
    allBanks: computed(() => {
      const preset = ['Metro Blood Centre','Westside Community Bank','Regional Medical Supply','City Central Blood Bank','North Regional Hospital','Pacific Regional Blood Bank','Apollo Blood Centre','City General Blood Bank','National Blood Service','State Blood Transfusion Council']
      const fromData = [
        ...externalBankRequests.value.map(r => r.requestingBank),
        ...outgoingBankRequests.value.map(r => r.targetBank),
      ].filter(Boolean)
      return [...new Set([...preset, ...fromData])].sort()
    }),
    addDonor, updateDonor, deleteDonor, recordDonation,
    addInventory, deductInventory,
    addRequest, updateRequestStatus, deleteRequest,
    submitBloodRequest, submitDonation, reviewDonationApplication,
    submitExternalBankRequest, updateExternalBankStatus,
    submitOutgoingRequest, updateOutgoingRequestStatus
  }
})
