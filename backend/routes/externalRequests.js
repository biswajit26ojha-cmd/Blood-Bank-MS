const express = require('express')
const crypto = require('crypto')
const { pool } = require('../db/database')
const { authenticate, requireStaff } = require('../middleware/auth')

const router = express.Router()

// ── POST /api/external-requests — any authenticated user can submit ────────────
router.post('/', authenticate, async (req, res) => {
  try {
    const { direction, bank_name, contact_name, contact_phone, contact_email, blood_type, units, urgency, reason, notes } = req.body
    if (!direction || !bank_name || !contact_name || !blood_type || !units || !urgency)
      return res.status(400).json({ error: 'direction, bank_name, contact_name, blood_type, units and urgency are required' })
    if (!['incoming', 'outgoing'].includes(direction))
      return res.status(400).json({ error: 'direction must be "incoming" or "outgoing"' })

    const id = crypto.randomUUID()
    await pool.query(
      `INSERT INTO external_requests (id, direction, bank_name, contact_name, contact_phone, contact_email, blood_type, units, urgency, reason, notes, submitted_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, direction, bank_name, contact_name, contact_phone || null, contact_email || null, blood_type, units, urgency, reason || null, notes || null, req.user.id]
    )
    await pool.query('INSERT INTO activity_log (id, type, message) VALUES (?, ?, ?)', [
      crypto.randomUUID(), 'request',
      `${direction === 'incoming' ? 'Incoming' : 'Outgoing'} inter-bank request: ${bank_name} — ${units} units of ${blood_type}`
    ])
    const [rows] = await pool.query('SELECT * FROM external_requests WHERE id = ?', [id])
    res.status(201).json({ request: rows[0] })
  } catch (err) {
    console.error(err); res.status(500).json({ error: 'Internal server error' })
  }
})

// ── GET /api/external-requests/mine — user's own submissions ─────────────────
router.get('/mine', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM external_requests WHERE submitted_by = ? ORDER BY request_date DESC',
      [req.user.id]
    )
    res.json({ requests: rows })
  } catch (err) {
    console.error(err); res.status(500).json({ error: 'Internal server error' })
  }
})

router.use(authenticate, requireStaff)

// ── GET /api/external-requests?direction=incoming|outgoing ────────────────────
router.get('/', async (req, res) => {
  try {
    const { direction } = req.query
    const [rows] = direction
      ? await pool.query('SELECT * FROM external_requests WHERE direction = ? ORDER BY request_date DESC', [direction])
      : await pool.query('SELECT * FROM external_requests ORDER BY request_date DESC')
    res.json({ requests: rows })
  } catch (err) {
    console.error(err); res.status(500).json({ error: 'Internal server error' })
  }
})

// ── POST removed — moved above requireStaff ───────────────────────────────────

// ── PATCH /api/external-requests/:id/status ───────────────────────────────────
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body
    const [rRows] = await pool.query('SELECT * FROM external_requests WHERE id = ?', [req.params.id])
    const row = rRows[0]
    if (!row) return res.status(404).json({ error: 'Request not found' })

    if (row.direction === 'incoming' && status === 'Approved') {
      const [invRows] = await pool.query('SELECT units FROM inventory WHERE blood_type = ?', [row.blood_type])
      const inv = invRows[0]
      if (!inv || inv.units < row.units)
        return res.status(400).json({ error: `Insufficient stock. Available: ${inv?.units ?? 0} units of ${row.blood_type}` })

      await pool.query('UPDATE inventory SET units = units - ? WHERE blood_type = ?', [row.units, row.blood_type])
      await pool.query('INSERT INTO activity_log (id, type, message) VALUES (?, ?, ?)', [
        crypto.randomUUID(), 'fulfill', `External request approved: ${row.units} units of ${row.blood_type} to ${row.bank_name}`
      ])
    }

    if (row.direction === 'outgoing' && status === 'Fulfilled') {
      await pool.query('UPDATE inventory SET units = units + ? WHERE blood_type = ?', [row.units, row.blood_type])
      await pool.query('INSERT INTO activity_log (id, type, message) VALUES (?, ?, ?)', [
        crypto.randomUUID(), 'fulfill', `Outgoing request fulfilled: received ${row.units} units of ${row.blood_type} from ${row.bank_name}`
      ])
    }

    const resolved = new Date().toISOString().slice(0, 10)
    await pool.query('UPDATE external_requests SET status = ?, resolved_date = ? WHERE id = ?', [status, resolved, req.params.id])
    const [rows] = await pool.query('SELECT * FROM external_requests WHERE id = ?', [req.params.id])
    res.json({ request: rows[0] })
  } catch (err) {
    console.error(err); res.status(500).json({ error: 'Internal server error' })
  }
})

module.exports = router
