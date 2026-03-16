const mysql = require('mysql2/promise')
const bcrypt = require('bcryptjs')
const crypto = require('crypto')

const pool = mysql.createPool({
  host:            process.env.DB_HOST     || 'localhost',
  port:            Number(process.env.DB_PORT) || 3306,
  user:            process.env.DB_USER     || 'root',
  password:        process.env.DB_PASSWORD || '',
  database:        process.env.DB_NAME     || 'bloodbank',
  waitForConnections: true,
  connectionLimit: 10,
  timezone:        'Z'
})

// ── Table definitions ────────────────────────────────────────────────────────

async function migrate() {
  const conn = await pool.getConnection()
  try {
    await conn.query(`
      CREATE TABLE IF NOT EXISTS users (
        id         VARCHAR(36)  NOT NULL PRIMARY KEY,
        name       VARCHAR(120) NOT NULL,
        email      VARCHAR(120) NOT NULL UNIQUE,
        password   VARCHAR(255) NOT NULL,
        role       ENUM('admin','staff','doctor','nurse','user') NOT NULL DEFAULT 'user',
        created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `)
    await conn.query(`
      CREATE TABLE IF NOT EXISTS donors (
        id               VARCHAR(36)  NOT NULL PRIMARY KEY,
        name             VARCHAR(120) NOT NULL,
        blood_type       VARCHAR(5)   NOT NULL,
        age              INT          NOT NULL,
        phone            VARCHAR(30),
        email            VARCHAR(120),
        city             VARCHAR(80),
        last_donation    DATE,
        total_donations  INT          NOT NULL DEFAULT 0,
        status           ENUM('Active','Inactive') NOT NULL DEFAULT 'Active',
        created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `)
    await conn.query(`
      CREATE TABLE IF NOT EXISTS blood_requests (
        id            VARCHAR(36)  NOT NULL PRIMARY KEY,
        patient_name  VARCHAR(120) NOT NULL,
        hospital      VARCHAR(120) NOT NULL,
        blood_type    VARCHAR(5)   NOT NULL,
        units         INT          NOT NULL,
        urgency       ENUM('Low','Medium','High','Critical') NOT NULL,
        status        ENUM('Pending','Approved','Fulfilled','Rejected') NOT NULL DEFAULT 'Pending',
        notes         TEXT,
        requested_by  VARCHAR(36),
        request_date  DATE         NOT NULL DEFAULT (CURDATE()),
        resolved_date DATE,
        CONSTRAINT fk_req_user FOREIGN KEY (requested_by) REFERENCES users(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `)
    await conn.query(`
      CREATE TABLE IF NOT EXISTS inventory (
        blood_type     VARCHAR(5)   NOT NULL PRIMARY KEY,
        units          INT          NOT NULL DEFAULT 0,
        min_threshold  INT          NOT NULL DEFAULT 10,
        updated_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `)
    await conn.query(`
      CREATE TABLE IF NOT EXISTS external_requests (
        id            VARCHAR(36)  NOT NULL PRIMARY KEY,
        direction     ENUM('incoming','outgoing') NOT NULL,
        bank_name     VARCHAR(120) NOT NULL,
        contact_name  VARCHAR(120) NOT NULL,
        contact_phone VARCHAR(30),
        contact_email VARCHAR(120),
        blood_type    VARCHAR(5)   NOT NULL,
        units         INT          NOT NULL,
        urgency       VARCHAR(20)  NOT NULL,
        reason        TEXT,
        notes         TEXT,
        status        VARCHAR(30)  NOT NULL DEFAULT 'Pending',
        request_date  DATE         NOT NULL DEFAULT (CURDATE()),
        resolved_date DATE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `)
    await conn.query(`
      CREATE TABLE IF NOT EXISTS user_submissions (
        id          VARCHAR(36)  NOT NULL PRIMARY KEY,
        user_id     VARCHAR(36)  NOT NULL,
        user_name   VARCHAR(120) NOT NULL,
        type        ENUM('request','donate') NOT NULL,
        data        JSON         NOT NULL,
        status      VARCHAR(40)  NOT NULL DEFAULT 'Pending Review',
        created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
        reviewed_at DATETIME,
        CONSTRAINT fk_sub_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `)
    await conn.query(`
      CREATE TABLE IF NOT EXISTS activity_log (
        id         VARCHAR(36)   NOT NULL PRIMARY KEY,
        type       VARCHAR(60)   NOT NULL,
        message    TEXT          NOT NULL,
        created_at DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `)
    console.log('✅ DB migration complete')
  } finally {
    conn.release()
  }
}

// ── Seed default admin if none exists ────────────────────────────────────────

async function seedAdmin() {
  const [rows] = await pool.query(`SELECT id FROM users WHERE role = 'admin' LIMIT 1`)
  if (rows.length === 0) {
    const id   = crypto.randomUUID()
    const hash = await bcrypt.hash('Admin@123', 10)
    await pool.query(
      `INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)`,
      [id, 'System Admin', 'admin@bloodbank.local', hash, 'admin']
    )
    console.log('✅ Default admin seeded  →  admin@bloodbank.local  /  Admin@123')
  }
}

// ── Seed inventory with default blood type rows ──────────────────────────────

async function seedInventory() {
  const defaultUnits = { 'O+': 38, 'A+': 22, 'B+': 15, 'AB+': 8, 'O-': 5, 'A-': 12, 'B-': 9, 'AB-': 3 }
  for (const [bt, units] of Object.entries(defaultUnits)) {
    await pool.query(
      `INSERT IGNORE INTO inventory (blood_type, units, min_threshold) VALUES (?, ?, 10)`,
      [bt, units]
    )
  }
}

// ── Public init (called once on server start) ─────────────────────────────────

async function init() {
  await migrate()
  await seedAdmin()
  await seedInventory()
}

module.exports = { pool, init }
