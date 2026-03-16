const express = require('express')
const crypto = require('crypto')
const { pool } = require('../db/database')
const { authenticate, requireStaff } = require('../middleware/auth')

const router = express.Router()
router.use(authenticate)

const staffRoles = ['admin', 'staff', 'doctor', 'nurse']

// ── GET /api/requests ─────────────────────────────────────────────────────────
// Staff see all; users see only their own
router.get('/', async (req, res) => {
  try {
    const isStaff = staffRoles.includes(req.user.role)
    const [rows] = isStaff
      ? await pool.query('SELECT * FROM blood_requests ORDER BY request_date DESC')
      : await pool.query('SELECT * FROM blood_requests WHERE requested_by = ? ORDER BY request_date DESC', [req.user.id])
    res.json({ requests: rows })
  } catch (err) {
    console.error(err); res.status(500).json({ error: 'Internal server error' })
  }
})

// ── POST /api/requests ────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { patient_name, hospital, blood_type, units, urgency, notes } = req.body
    if (!patient_name || !hospital || !blood_type || !units || !urgency)
      return res.status(400).json({ error: 'patient_name, hospital, blood_type, units and urgency are required' })

    const id = crypto.randomUUID()
    await pool.query(
      `INSERT INTO blood_requests (id, patient_name, hospital, blood_type, units, urgency, notes, requested_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, patient_name, hospital, blood_type, units, urgency, notes || null, req.user.id]
    )
    await pool.query('INSERT INTO activity_log (id, type, message) VALUES (?, ?, ?)', [
      crypto.randomUUID(), 'request', `New blood request from ${hospital} (${blood_type}, ${units} units)`
    ])
    const [rows] = await pool.query('SELECT * FROM blood_requests WHERE id = ?', [id])
    res.status(201).json({ request: rows[0] })
  } catch (err) {
    console.error(err); res.status(500).json({ error: 'Internal server error' })
  }
})

// ── PATCH /api/requests/:id/status ───────────────────────────────────────────
router.patch('/:id/status', requireStaff, async (req, res) => {
  try {
    const { status } = req.body
    const validStatuses = ['Pending', 'Approved', 'Fulfilled', 'Rejected']
    if (!validStatuses.includes(status)) return res.status(400).json({ error: 'Invalid status' })

    const [rRows] = await pool.query('SELECT * FROM blood_requests WHERE id = ?', [req.params.id])
    const req_ = rRows[0]
    if (!req_) return res.status(404).json({ error: 'Request not found' })

    if (status === 'Fulfilled') {
      const [invRows] = await pool.query('SELECT units FROM inventory WHERE blood_type = ?', [req_.blood_type])
      const inv = invRows[0]
      if (!inv || inv.units < req_.units)
        return res.status(400).json({ error: `Insufficient stock. Available: ${inv?.units ?? 0} units of ${req_.blood_type}` })

      await pool.query('UPDATE inventory SET units = units - ? WHERE blood_type = ?', [req_.units, req_.blood_type])
      await pool.query('INSERT INTO activity_log (id, type, message) VALUES (?, ?, ?)', [
        crypto.randomUUID(), 'fulfill', `Request fulfilled — ${req_.blood_type} (${req_.units} units) to ${req_.hospital}`
      ])
    }

    const resolved = ['Fulfilled', 'Rejected'].includes(status) ? new Date().toISOString().slice(0, 10) : null
    await pool.query('UPDATE blood_requests SET status = ?, resolved_date = ? WHERE id = ?', [status, resolved, req.params.id])
    const [rows] = await pool.query('SELECT * FROM blood_requests WHERE id = ?', [req.params.id])
    res.json({ request: rows[0] })
  } catch (err) {
    console.error(err); res.status(500).json({ error: 'Internal server error' })
  }
})

// ── DELETE /api/requests/:id ──────────────────────────────────────────────────
router.delete('/:id', requireStaff, async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM blood_requests WHERE id = ?', [req.params.id])
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Request not found' })
    res.json({ message: 'Request deleted' })
  } catch (err) {
    console.error(err); res.status(500).json({ error: 'Internal server error' })
  }
})

module.exports = router
