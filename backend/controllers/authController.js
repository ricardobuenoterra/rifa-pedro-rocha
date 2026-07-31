const { db, verifyPassword } = require('../../database/db');

exports.login = (req, res) => {
  const { username, password } = req.body;
  const admin = db.prepare('SELECT * FROM admins WHERE username = ?').get(username || '');
  if (!admin || !verifyPassword(password || '', admin.password_hash)) return res.status(401).json({ error: 'Usuário ou senha inválidos.' });
  req.session.adminId = admin.id;
  res.json({ ok: true });
};
exports.logout = (req, res) => req.session.destroy(() => res.json({ ok: true }));
exports.me = (req, res) => res.json({ authenticated: Boolean(req.session.adminId) });
