// Central API client — all calls to the Express backend go through here.
// The token is read from localStorage on every request so it's always fresh.

const BASE = import.meta.env.VITE_API_URL || '/api'

function getToken() {
  return localStorage.getItem('bb_token') || ''
}

async function request(method, path, body) {
  const headers = { 'Content-Type': 'application/json' }
  const token = getToken()
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  const data = await res.json()
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
  return data
}

export const api = {
  // ── Auth ──────────────────────────────────────────────────────────────────
  login:          (email, password)        => request('POST', '/auth/login',           { email, password }),
  adminLogin:     (email, password)        => request('POST', '/auth/admin-login',     { email, password }),
  register:       (name, email, password)  => request('POST', '/auth/register',        { name, email, password }),
  me:             ()                       => request('GET',  '/auth/me'),
  changePassword: (currentPassword, newPassword) =>
    request('POST', '/auth/change-password', { currentPassword, newPassword }),

  // ── Users (admin) ─────────────────────────────────────────────────────────
  getUsers:      ()             => request('GET',    '/users'),
  updateRole:    (id, role)     => request('PATCH',  `/users/${id}/role`,          { role }),
  resetPassword: (id, newPassword) => request('POST', `/users/${id}/reset-password`, { newPassword }),
  deleteUser:    (id)           => request('DELETE', `/users/${id}`),

  // ── Donors ────────────────────────────────────────────────────────────────
  getDonors:      ()         => request('GET',    '/donors'),
  createDonor:    (d)        => request('POST',   '/donors',                     d),
  updateDonor:    (id, d)    => request('PATCH',  `/donors/${id}`,               d),
  recordDonation: (id)       => request('POST',   `/donors/${id}/record-donation`),
  deleteDonor:    (id)       => request('DELETE', `/donors/${id}`),

  // ── Inventory ─────────────────────────────────────────────────────────────
  getInventory:       ()                            => request('GET',   '/inventory'),
  getPublicInventory: ()                            => request('GET',   '/inventory/public'),
  adjustInventory: (blood_type, action, units, reason) =>
    request('POST',  '/inventory/adjust', { blood_type, action, units, reason }),
  updateThreshold: (blood_type, min_threshold)      =>
    request('PATCH', `/inventory/${encodeURIComponent(blood_type)}/threshold`, { min_threshold }),

  // ── Blood requests ────────────────────────────────────────────────────────
  getRequests:         ()           => request('GET',    '/requests'),
  createRequest:       (r)          => request('POST',   '/requests',              r),
  updateRequestStatus: (id, status) => request('PATCH',  `/requests/${id}/status`, { status }),
  deleteRequest:       (id)         => request('DELETE', `/requests/${id}`),

  // ── External / inter-bank requests ────────────────────────────────────────
  getExternalRequests:   (direction) =>
    request('GET',   `/external-requests${direction ? `?direction=${direction}` : ''}`),
  createExternalRequest: (d)         => request('POST',  '/external-requests',              d),
  updateExternalStatus:  (id, status) => request('PATCH', `/external-requests/${id}/status`, { status }),

  // ── Activity log ──────────────────────────────────────────────────────────
  getActivity: (limit = 100, type) =>
    request('GET', `/activity?limit=${limit}${type ? `&type=${type}` : ''}`),
}
