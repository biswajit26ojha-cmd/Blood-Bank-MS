const jwt = require('jsonwebtoken')

const JWT_SECRET = process.env.JWT_SECRET || 'changeme-use-dotenv'

/**
 * Verify Bearer JWT token. Attaches decoded payload to req.user.
 */
function authenticate(req, res, next) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' })
  }
  const token = header.slice(7)
  try {
    req.user = jwt.verify(token, JWT_SECRET)
    next()
  } catch {
    return res.status(401).json({ error: 'Token expired or invalid' })
  }
}

/**
 * Allow only admin role.
 */
function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' })
  }
  next()
}

/**
 * Allow staff roles (admin, staff, doctor, nurse) — block patient users.
 */
function requireStaff(req, res, next) {
  const staffRoles = ['admin', 'staff', 'doctor', 'nurse']
  if (!staffRoles.includes(req.user?.role)) {
    return res.status(403).json({ error: 'Staff access required' })
  }
  next()
}

/**
 * Sign a JWT for a given user object.
 */
function signToken(user) {
  return jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '8h' }
  )
}

module.exports = { authenticate, requireAdmin, requireStaff, signToken }
