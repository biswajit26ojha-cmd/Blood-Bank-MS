const express = require('express')
const bcrypt = require('bcryptjs')
const crypto = require('crypto')
const { pool } = require('../db/database')
const { signToken, authenticate } = require('../middleware/auth')

const router = express.Router()

// ── POST /api/auth/register ───────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body
    if (!name || !email || !password)
      return res.status(400).json({ error: 'name, email and password are required' })
    if (password.length < 6)
      return res.status(400).json({ error: 'Password must be at least 6 characters' })

    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email.toLowerCase()])
    if (existing.length > 0)
      return res.status(409).json({ error: 'Email already registered' })

    const id = crypto.randomUUID()
    const hash = await bcrypt.hash(password, 10)
    await pool.query(
      `INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, 'user')`,
      [id, name.trim(), email.toLowerCase(), hash]
    )
    await pool.query(
      `INSERT INTO activity_log (id, type, message) VALUES (?, 'user', ?)`,
      [crypto.randomUUID(), `New user registered: ${name} (${email})`]
    )
    const [rows] = await pool.query('SELECT id, name, email, role, created_at FROM users WHERE id = ?', [id])
    const user = rows[0]
    return res.status(201).json({ token: signToken(user), user })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ── POST /api/auth/login ──────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password)
      return res.status(400).json({ error: 'email and password are required' })

    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email.toLowerCase()])
    const user = rows[0]
    if (!user) return res.status(401).json({ error: 'Invalid email or password' })

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) return res.status(401).json({ error: 'Invalid email or password' })

    const { password: _pw, ...safeUser } = user
    return res.json({ token: signToken(safeUser), user: safeUser })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ── POST /api/auth/admin-login ────────────────────────────────────────────────
router.post('/admin-login', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password)
      return res.status(400).json({ error: 'email and password are required' })

    const [rows] = await pool.query('SELECT * FROM users WHERE email = ? AND role = ?', [email.toLowerCase(), 'admin'])
    const user = rows[0]
    if (!user) return res.status(401).json({ error: 'Invalid admin credentials' })

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) return res.status(401).json({ error: 'Invalid admin credentials' })

    const { password: _pw, ...safeUser } = user
    return res.json({ token: signToken(safeUser), user: safeUser })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
router.get('/me', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, name, email, role, created_at FROM users WHERE id = ?', [req.user.id])
    if (!rows[0]) return res.status(404).json({ error: 'User not found' })
    return res.json({ user: rows[0] })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ── POST /api/auth/change-password ───────────────────────────────────────────
router.post('/change-password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body
    if (!currentPassword || !newPassword)
      return res.status(400).json({ error: 'currentPassword and newPassword are required' })
    if (newPassword.length < 6)
      return res.status(400).json({ error: 'New password must be at least 6 characters' })

    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [req.user.id])
    const user = rows[0]
    const valid = await bcrypt.compare(currentPassword, user.password)
    if (!valid) return res.status(401).json({ error: 'Current password is incorrect' })

    const hash = await bcrypt.hash(newPassword, 10)
    await pool.query('UPDATE users SET password = ? WHERE id = ?', [hash, req.user.id])
    return res.json({ message: 'Password changed successfully' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

module.exports = router
