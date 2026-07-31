const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const Database = require('better-sqlite3');
const config = require('../backend/config');

fs.mkdirSync(path.dirname(config.dbPath), { recursive: true });
const db = new Database(config.dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, hash] = String(stored || '').split(':');
  if (!salt || !hash) return false;
  const candidate = crypto.scryptSync(password, salt, 64);
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), candidate);
}

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL DEFAULT ''
    );
    CREATE TABLE IF NOT EXISTS tickets (
      number INTEGER PRIMARY KEY,
      status TEXT NOT NULL CHECK(status IN ('available','reserved','sold')) DEFAULT 'available',
      name TEXT,
      phone TEXT,
      note TEXT,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const insertTicket = db.prepare('INSERT OR IGNORE INTO tickets (number) VALUES (?)');
  const seedTickets = db.transaction(() => {
    for (let n = config.raffle.start; n <= config.raffle.end; n += 1) insertTicket.run(n);
  });
  seedTickets();

  const setting = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
  [['live_link', ''], ['result_number', ''], ['result_winner', ''], ['result_replay_link', ''], ['banner_image', ''], ['pix_qr_image', ''], ['pix_key', ''], ['pix_receiver', '']].forEach(([key, value]) => setting.run(key, value));

  const adminExists = db.prepare('SELECT id FROM admins WHERE username = ?').get(config.adminUser);
  if (!adminExists) db.prepare('INSERT INTO admins (username, password_hash) VALUES (?, ?)').run(config.adminUser, hashPassword(config.adminPassword));
}

module.exports = { db, initDatabase, verifyPassword };
