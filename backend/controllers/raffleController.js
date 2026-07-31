const { db } = require('../../database/db');
const config = require('../config');

const publicTicketFields = 'number, status, name, phone, note';
const imageDataRegex = /^data:image\/(png|jpeg|jpg|webp);base64,[A-Za-z0-9+/=]+$/;

function normalizePhone(phone = '') {
  return String(phone).replace(/\D/g, '');
}

function getSettings() {
  return Object.fromEntries(db.prepare('SELECT key, value FROM settings').all().map((row) => [row.key, row.value]));
}

function getSummary() {
  const rows = db.prepare('SELECT status, COUNT(*) total FROM tickets GROUP BY status').all();
  const counts = { available: 0, reserved: 0, sold: 0 };
  rows.forEach((row) => { counts[row.status] = row.total; });
  return {
    ...counts,
    raised: counts.sold * config.ticketPrice,
    expected: (config.raffle.end - config.raffle.start + 1) * config.ticketPrice,
  };
}

exports.publicData = (req, res) => {
  const tickets = db.prepare(`SELECT number, status FROM tickets ORDER BY number`).all();
  res.json({ raffle: config.raffle, ticketPrice: config.ticketPrice, summary: getSummary(), settings: getSettings(), tickets });
};

exports.reserve = (req, res) => {
  const { name, phone, note = '', numbers = [] } = req.body;
  const cleanPhone = normalizePhone(phone);
  const selected = [...new Set(numbers.map(Number))].filter((n) => n >= config.raffle.start && n <= config.raffle.end);
  if (!name || cleanPhone.length < 10 || selected.length === 0) return res.status(400).json({ error: 'Informe nome, telefone válido e ao menos um número.' });

  const unavailable = db.prepare(`SELECT number FROM tickets WHERE number IN (${selected.map(() => '?').join(',')}) AND status != 'available'`).all(...selected);
  if (unavailable.length) return res.status(409).json({ error: `Número(s) indisponível(is): ${unavailable.map((t) => t.number).join(', ')}` });

  const reserveTx = db.transaction(() => {
    const stmt = db.prepare(`UPDATE tickets SET status = 'reserved', name = ?, phone = ?, note = ?, updated_at = CURRENT_TIMESTAMP WHERE number = ? AND status = 'available'`);
    selected.forEach((number) => stmt.run(name.trim(), cleanPhone, String(note).trim(), number));
  });
  reserveTx();
  res.json({ ok: true, numbers: selected });
};

exports.consult = (req, res) => {
  const phone = normalizePhone(req.query.phone);
  if (phone.length < 10) return res.status(400).json({ error: 'Telefone inválido.' });
  const tickets = db.prepare(`SELECT number, status FROM tickets WHERE phone = ? ORDER BY number`).all(phone);
  res.json({ tickets });
};

exports.adminData = (req, res) => {
  const q = String(req.query.q || '').trim();
  let tickets;
  if (q) {
    const like = `%${q}%`;
    tickets = db.prepare(`SELECT ${publicTicketFields}, updated_at FROM tickets WHERE CAST(number AS TEXT) LIKE ? OR name LIKE ? OR phone LIKE ? ORDER BY number`).all(like, like, like);
  } else {
    tickets = db.prepare(`SELECT ${publicTicketFields}, updated_at FROM tickets ORDER BY number`).all();
  }
  res.json({ raffle: config.raffle, ticketPrice: config.ticketPrice, summary: getSummary(), settings: getSettings(), tickets });
};

exports.updateTicket = (req, res) => {
  const number = Number(req.params.number);
  const { status, name = '', phone = '', note = '' } = req.body;
  if (!['available', 'reserved', 'sold'].includes(status)) return res.status(400).json({ error: 'Status inválido.' });
  const cleanPhone = normalizePhone(phone);
  const data = status === 'available' ? ['', '', ''] : [String(name).trim(), cleanPhone, String(note).trim()];
  db.prepare(`UPDATE tickets SET status = ?, name = ?, phone = ?, note = ?, updated_at = CURRENT_TIMESTAMP WHERE number = ?`).run(status, ...data, number);
  res.json({ ok: true });
};

exports.updateSettings = (req, res) => {
  try {
    const allowed = ['live_link', 'result_number', 'result_winner', 'result_replay_link', 'pix_key', 'pix_receiver'];
    const imageKeys = ['banner_image', 'pix_qr_image'];
    const stmt = db.prepare('UPDATE settings SET value = ? WHERE key = ?');
    allowed.forEach((key) => stmt.run(String(req.body[key] || '').trim(), key));
    imageKeys.forEach((key) => {
      const value = String(req.body[key] || '').trim();
      if (!value || value === '__KEEP__') return;
      if (value === '__REMOVE__') return stmt.run('', key);
      if (!imageDataRegex.test(value) || value.length > 5_000_000) {
        throw Object.assign(new Error('Imagem inválida ou maior que o limite permitido.'), { statusCode: 400 });
      }
      stmt.run(value, key);
    });
    res.json({ ok: true, settings: getSettings() });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message || 'Erro ao salvar configurações.' });
  }
};

exports.deleteReservation = (req, res) => {
  db.prepare(`UPDATE tickets SET status = 'available', name = NULL, phone = NULL, note = NULL, updated_at = CURRENT_TIMESTAMP WHERE number = ?`).run(Number(req.params.number));
  res.json({ ok: true });
};
