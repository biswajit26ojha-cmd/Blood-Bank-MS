const express = require('express')
const crypto = require('crypto')
const { pool } = require('../db/database')
const { authenticate, requireStaff } = require('../middleware/auth')

const router = express.Router()

// ── GET /api/inventory — all authenticated users ──────────────────────────────
router.get('/', authenticate, async (req, res) => {
  try {
    const [inventory] = await pool.query('SELECT * FROM inventory ORDER BY blood_type')
    res.json({ inventory })
  } catch (err) {
    console.error(err); res.status(500).json({ error: 'Internal server error' })
  }
})

// ── POST /api/inventory/adjust — staff only ───────────────────────────────────
router.post('/adjust', authenticate, requireStaff, async (req, res) => {
  try {
    const { blood_type, action, units, reason } = req.body
    if (!blood_type || !action || !units)
      return res.status(400).json({ error: 'blood_type, action and units are required' })
    if (!['add', 'deduct'].includes(action))
      return res.status(400).json({ error: 'action must be "add" or "deduct"' })

    const [rows] = await pool.query('SELECT units FROM inventory WHERE blood_type = ?', [blood_type])
    if (!rows[0]) return res.status(404).json({ error: 'Blood type not found in inventory' })

    const newUnits = action === 'add' ? rows[0].units + units : rows[0].units - units
    if (newUnits < 0)
      return res.status(400).json({ error: `Insufficient stock. Available: ${rows[0].units} units` })

    await pool.query('UPDATE inventory SET units = ? WHERE blood_type = ?', [newUnits, blood_type])
    await pool.query('INSERT INTO activity_log (id, type, message) VALUES (?, ?, ?)', [
      crypto.randomUUID(), 'fulfill',
      `Inventory ${action}: ${action === 'add' ? '+' : '-'}${units} units of ${blood_type}${reason ? ' — ' + reason : ''}`
    ])
    res.json({ blood_type, units: newUnits })
  } catch (err) {
    console.error(err); res.status(500).json({ error: 'Internal server error' })
  }
})

// ── PATCH /api/inventory/:blood_type/threshold — staff only ──────────────────
router.patch('/:blood_type/threshold', authenticate, requireStaff, async (req, res) => {
  try {
    const { min_threshold } = req.body
    if (min_threshold === undefined || min_threshold < 0)
      return res.status(400).json({ error: 'Valid min_threshold is required' })

    const [result] = await pool.query(
      'UPDATE inventory SET min_threshold = ? WHERE blood_type = ?',
      [min_threshold, req.params.blood_type]
    )
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Blood type not found' })
    res.json({ message: 'Threshold updated' })
  } catch (err) {
    console.error(err); res.status(500).json({ error: 'Internal server error' })
  }
})

module.exports = router
