require('dotenv').config()
const express = require('express')
const cors = require('cors')
const { init } = require('./db/database')

const app = express()
const PORT = process.env.PORT || 3000

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}))
app.use(express.json())

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',             require('./routes/auth'))
app.use('/api/users',            require('./routes/users'))
app.use('/api/donors',           require('./routes/donors'))
app.use('/api/inventory',        require('./routes/inventory'))
app.use('/api/requests',         require('./routes/requests'))
app.use('/api/external-requests',require('./routes/externalRequests'))
app.use('/api/activity',         require('./routes/activity'))

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }))

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: 'Route not found' }))

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error(err)
  res.status(500).json({ error: 'Internal server error' })
})

// ── Start ─────────────────────────────────────────────────────────────────────
init()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🩸 Blood Bank API running at http://localhost:${PORT}`)
    })
  })
  .catch(err => {
    console.error('❌ DB init failed:', err)
    process.exit(1)
  })
