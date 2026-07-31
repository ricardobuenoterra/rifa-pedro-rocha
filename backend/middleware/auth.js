module.exports = (req, res, next) => {
  if (req.session && req.session.adminId) return next();
  return res.status(401).json({ error: 'Acesso não autorizado.' });
};
