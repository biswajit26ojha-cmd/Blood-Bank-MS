const express = require('express')
const crypto = require('crypto')
const { pool } = require('../db/database')
const { authenticate, requireStaff } = require('../middleware/auth')

const router = express.Router()
router.use(authenticate, requireStaff)

// ── GET /api/donors ───────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const [donors] = await pool.query('SELECT * FROM donors ORDER BY created_at DESC')
    res.json({ donors })
  } catch (err) {
    console.error(err); res.status(500).json({ error: 'Internal server error' })
  }
})

// ── POST /api/donors ──────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { name, blood_type, age, phone, email, city, last_donation, status } = req.body
    if (!name || !blood_type || !age)
      return res.status(400).json({ error: 'name, blood_type and age are required' })

    const id = crypto.randomUUID()
    await pool.query(
      `INSERT INTO donors (id, name, blood_type, age, phone, email, city, last_donation, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, name, blood_type, age, phone || null, email || null, city || null, last_donation || null, status || 'Active']
    )
    await pool.query('INSERT INTO activity_log (id, type, message) VALUES (?, ?, ?)', [
      crypto.randomUUID(), 'donor', `New donor registered: ${name} (${blood_type})`
    ])
    const [rows] = await pool.query('SELECT * FROM donors WHERE id = ?', [id])
    res.status(201).json({ donor: rows[0] })
  } catch (err) {
    console.error(err); res.status(500).json({ error: 'Internal server error' })
  }
})

// ── PATCH /api/donors/:id ─────────────────────────────────────────────────────
router.patch('/:id', async (req, res) => {
  try {
    const [existing] = await pool.query('SELECT id FROM donors WHERE id = ?', [req.params.id])
    if (!existing[0]) return res.status(404).json({ error: 'Donor not found' })

    const fields = ['name', 'blood_type', 'age', 'phone', 'email', 'city', 'last_donation', 'status']
    const updates = []
    const values = []
    for (const f of fields) {
      if (req.body[f] !== undefined) { updates.push(`${f} = ?`); values.push(req.body[f]) }
    }
    if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' })

    values.push(req.params.id)
    await pool.query(`UPDATE donors SET ${updates.join(', ')} WHERE id = ?`, values)
    const [rows] = await pool.query('SELECT * FROM donors WHERE id = ?', [req.params.id])
    res.json({ donor: rows[0] })
  } catch (err) {
    console.error(err); res.status(500).json({ error: 'Internal server error' })
  }
})

// ── POST /api/donors/:id/record-donation ──────────────────────────────────────
router.post('/:id/record-donation', async (req, res) => {
  try {
    const [dRows] = await pool.query('SELECT * FROM donors WHERE id = ?', [req.params.id])
    const donor = dRows[0]
    if (!donor) return res.status(404).json({ error: 'Donor not found' })

    const today = new Date().toISOString().slice(0, 10)
    await pool.query(
      'UPDATE donors SET total_donations = total_donations + 1, last_donation = ? WHERE id = ?',
      [today, req.params.id]
    )
    await pool.query('UPDATE inventory SET units = units + 1 WHERE blood_type = ?', [donor.blood_type])
    await pool.query('INSERT INTO activity_log (id, type, message) VALUES (?, ?, ?)', [
      crypto.randomUUID(), 'donor', `Donation recorded for ${donor.name} (${donor.blood_type})`
    ])
    const [rows] = await pool.query('SELECT * FROM donors WHERE id = ?', [req.params.id])
    res.json({ donor: rows[0] })
  } catch (err) {
    console.error(err); res.status(500).json({ error: 'Internal server error' })
  }
})

// ── DELETE /api/donors/:id ────────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT name FROM donors WHERE id = ?', [req.params.id])
    if (!rows[0]) return res.status(404).json({ error: 'Donor not found' })

    await pool.query('DELETE FROM donors WHERE id = ?', [req.params.id])
    await pool.query('INSERT INTO activity_log (id, type, message) VALUES (?, ?, ?)', [
      crypto.randomUUID(), 'donor', `Donor removed: ${rows[0].name}`
    ])
    res.json({ message: 'Donor deleted' })
  } catch (err) {
    console.error(err); res.status(500).json({ error: 'Internal server error' })
  }
})

module.exports = router
