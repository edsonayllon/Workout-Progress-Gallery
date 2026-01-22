import Database from 'better-sqlite3'
import { readFileSync, mkdirSync, existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Ensure data directory exists
const dataDir = join(__dirname, '../../data')
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true })
}

const db = new Database(join(dataDir, 'workout.db'))
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

// Initialize schema
const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf-8')
db.exec(schema)

// Clean up expired sessions and challenges periodically
function cleanupExpired() {
  const now = new Date().toISOString()
  db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(now)
  db.prepare('DELETE FROM challenges WHERE expires_at < ?').run(now)
}

// Run cleanup every hour
setInterval(cleanupExpired, 60 * 60 * 1000)
cleanupExpired()

// User queries
export const userQueries = {
  create: db.prepare('INSERT INTO users (id, username) VALUES (?, ?)'),
  findById: db.prepare('SELECT * FROM users WHERE id = ?'),
  findByUsername: db.prepare('SELECT * FROM users WHERE username = ?'),
  updateUsername: db.prepare('UPDATE users SET username = ? WHERE id = ?'),
}

// Credential queries
export const credentialQueries = {
  create: db.prepare(`
    INSERT INTO credentials (id, user_id, public_key, counter, transports)
    VALUES (?, ?, ?, ?, ?)
  `),
  findById: db.prepare('SELECT * FROM credentials WHERE id = ?'),
  findByUserId: db.prepare('SELECT * FROM credentials WHERE user_id = ?'),
  updateCounter: db.prepare('UPDATE credentials SET counter = ? WHERE id = ?'),
}

// Photo queries
export const photoQueries = {
  create: db.prepare(`
    INSERT INTO photos (id, user_id, filename, date, weight, measurements)
    VALUES (?, ?, ?, ?, ?, ?)
  `),
  findById: db.prepare('SELECT * FROM photos WHERE id = ?'),
  findByUserId: db.prepare('SELECT * FROM photos WHERE user_id = ? ORDER BY date ASC'),
  update: db.prepare(`
    UPDATE photos SET date = ?, weight = ?, measurements = ?
    WHERE id = ? AND user_id = ?
  `),
  delete: db.prepare('DELETE FROM photos WHERE id = ? AND user_id = ?'),
}

// Session queries
export const sessionQueries = {
  create: db.prepare('INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)'),
  findById: db.prepare('SELECT * FROM sessions WHERE id = ?'),
  delete: db.prepare('DELETE FROM sessions WHERE id = ?'),
  deleteByUserId: db.prepare('DELETE FROM sessions WHERE user_id = ?'),
}

// Challenge queries
export const challengeQueries = {
  create: db.prepare(`
    INSERT INTO challenges (id, challenge, type, user_id, expires_at)
    VALUES (?, ?, ?, ?, ?)
  `),
  findById: db.prepare('SELECT * FROM challenges WHERE id = ?'),
  delete: db.prepare('DELETE FROM challenges WHERE id = ?'),
}

export default db
