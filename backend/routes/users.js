const express = require('express')
const crypto = require('crypto')
const bcrypt = require('bcryptjs')
const { pool } = require('../db/database')
const { authenticate, requireAdmin } = require('../middleware/auth')

const router = express.Router()
router.use(authenticate, requireAdmin)

// ── GET /api/users ────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const [users] = await pool.query('SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC')
    res.json({ users })
  } catch (err) {
    console.error(err); res.status(500).json({ error: 'Internal server error' })
  }
})

// ── PATCH /api/users/:id/role ─────────────────────────────────────────────────
router.patch('/:id/role', async (req, res) => {
  try {
    const { role } = req.body
    const validRoles = ['admin', 'staff', 'doctor', 'nurse', 'user']
    if (!validRoles.includes(role)) return res.status(400).json({ error: 'Invalid role' })
    if (req.params.id === req.user.id) return res.status(400).json({ error: 'Cannot change your own role' })

    const [result] = await pool.query('UPDATE users SET role = ? WHERE id = ?', [role, req.params.id])
    if (result.affectedRows === 0) return res.status(404).json({ error: 'User not found' })

    await pool.query('INSERT INTO activity_log (id, type, message) VALUES (?, ?, ?)', [
      crypto.randomUUID(), 'user', `Role changed to '${role}' for user ${req.params.id}`
    ])
    res.json({ message: 'Role updated' })
  } catch (err) {
    console.error(err); res.status(500).json({ error: 'Internal server error' })
  }
})

// ── POST /api/users/:id/reset-password ───────────────────────────────────────
router.post('/:id/reset-password', async (req, res) => {
  try {
    const { newPassword } = req.body
    if (!newPassword || newPassword.length < 6)
      return res.status(400).json({ error: 'newPassword must be at least 6 characters' })

    const hash = await bcrypt.hash(newPassword, 10)
    const [result] = await pool.query('UPDATE users SET password = ? WHERE id = ?', [hash, req.params.id])
    if (result.affectedRows === 0) return res.status(404).json({ error: 'User not found' })
    res.json({ message: 'Password reset successfully' })
  } catch (err) {
    console.error(err); res.status(500).json({ error: 'Internal server error' })
  }
})

// ── DELETE /api/users/:id ─────────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    if (req.params.id === req.user.id) return res.status(400).json({ error: 'Cannot delete your own account' })
    const [rows] = await pool.query('SELECT name, email FROM users WHERE id = ?', [req.params.id])
    const user = rows[0]
    if (!user) return res.status(404).json({ error: 'User not found' })

    await pool.query('DELETE FROM users WHERE id = ?', [req.params.id])
    await pool.query('INSERT INTO activity_log (id, type, message) VALUES (?, ?, ?)', [
      crypto.randomUUID(), 'user', `User deleted: ${user.name} (${user.email})`
    ])
    res.json({ message: 'User deleted' })
  } catch (err) {
    console.error(err); res.status(500).json({ error: 'Internal server error' })
  }
})

module.exports = router
