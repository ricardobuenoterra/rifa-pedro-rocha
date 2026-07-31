const path = require('path');
require('dotenv').config();

const ROOT = path.join(__dirname, '..');

module.exports = {
  port: Number(process.env.PORT || 3000),
  sessionSecret: process.env.SESSION_SECRET || 'troque-este-segredo-em-producao',
  adminUser: process.env.ADMIN_USER || 'admin',
  adminPassword: process.env.ADMIN_PASSWORD || 'admin123',
  ticketPrice: Number(process.env.TICKET_PRICE || 0),
  dbPath: process.env.DB_PATH || path.join(ROOT, 'database', 'rifa.sqlite'),
  frontendPath: path.join(ROOT, 'frontend', 'public'),
  adminPath: path.join(ROOT, 'frontend', 'admin'),
  raffle: {
    title: 'Rifa iPhone 16 256GB - Esperia',
    drawDate: '2026-09-30',
    whatsapp: '5511998889326',
    owner: 'Ricardo',
    start: 1041,
    end: 1070,
  },
};
