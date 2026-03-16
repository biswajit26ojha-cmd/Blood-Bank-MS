const express = require('express')
const { pool } = require('../db/database')
const { authenticate, requireStaff } = require('../middleware/auth')

const router = express.Router()
router.use(authenticate, requireStaff)

// ── GET /api/activity ─────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100
    const type = req.query.type
    const [rows] = type
      ? await pool.query('SELECT * FROM activity_log WHERE type = ? ORDER BY created_at DESC LIMIT ?', [type, limit])
      : await pool.query('SELECT * FROM activity_log ORDER BY created_at DESC LIMIT ?', [limit])
    res.json({ log: rows })
  } catch (err) {
    console.error(err); res.status(500).json({ error: 'Internal server error' })
  }
})

module.exports = router
