const $ = (selector) => document.querySelector(selector);
let data;
let bannerImage = '__KEEP__';
let pixQrImage = '__KEEP__';

async function check() {
  const response = await fetch('/api/admin/me');
  const result = await response.json();
  if (result.authenticated) showApp();
}

async function showApp() {
  $('.login').style.display = 'none';
  $('.app').style.display = 'block';
  await load();
}

async function load(q = '') {
  const response = await fetch(`/api/admin/dashboard?q=${encodeURIComponent(q)}`);
  if (response.status === 401) {
    $('.login').style.display = 'grid';
    $('.app').style.display = 'none';
    return;
  }
  data = await response.json();
  render();
}

function money(value) {
  return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function preview(selector, image) {
  $(selector).innerHTML = image ? `<img src="${image}" alt="Prévia">` : '<span>Nenhuma imagem cadastrada</span>';
}

function render() {
  const { summary, settings } = data;
  $('#stats').innerHTML = `
    <div class="card stat">Disponível<br><strong>${summary.available}</strong></div>
    <div class="card stat">Reservada<br><strong>${summary.reserved}</strong></div>
    <div class="card stat">Vendida<br><strong>${summary.sold}</strong></div>
    <div class="card stat">Arrecadado<br><strong>${money(summary.raised)}</strong></div>
    <div class="card stat">Previsto<br><strong>${money(summary.expected)}</strong></div>
  `;

  $('#live_link').value = settings.live_link;
  $('#result_number').value = settings.result_number;
  $('#result_winner').value = settings.result_winner;
  $('#result_replay_link').value = settings.result_replay_link;
  $('#pix_key').value = settings.pix_key;
  $('#pix_receiver').value = settings.pix_receiver;
  preview('#bannerPreview', settings.banner_image);
  preview('#pixPreview', settings.pix_qr_image);

  $('#tickets').innerHTML = data.tickets.map((ticket) => `
    <div class="row">
      <b class="number-badge ${ticket.status}">${ticket.number}</b>
      <select data-f="status" data-n="${ticket.number}">
        <option value="available">Disponível</option>
        <option value="reserved">Reservado</option>
        <option value="sold">Vendido</option>
      </select>
      <input data-f="name" data-n="${ticket.number}" value="${ticket.name || ''}" placeholder="Nome">
      <input data-f="phone" data-n="${ticket.number}" value="${ticket.phone || ''}" placeholder="Telefone">
      <input data-f="note" data-n="${ticket.number}" value="${ticket.note || ''}" placeholder="Observação">
      <div class="actions"><button onclick="saveTicket(${ticket.number})">Salvar</button><button class="danger" onclick="freeTicket(${ticket.number})">Liberar</button></div>
    </div>
  `).join('');
  data.tickets.forEach((ticket) => { document.querySelector(`[data-f=status][data-n='${ticket.number}']`).value = ticket.status; });
}

function readImage(input, callback) {
  const file = input.files?.[0];
  if (!file) return;
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) return alert('Envie uma imagem PNG, JPG ou WEBP.');
  if (file.size > 3_500_000) return alert('A imagem deve ter até 3,5 MB.');
  const reader = new FileReader();
  reader.onload = () => callback(reader.result);
  reader.readAsDataURL(file);
}

$('#banner_file').addEventListener('change', (event) => readImage(event.target, (image) => { bannerImage = image; preview('#bannerPreview', image); }));
$('#pix_qr_file').addEventListener('change', (event) => readImage(event.target, (image) => { pixQrImage = image; preview('#pixPreview', image); }));
$('#remove_banner').onclick = () => { bannerImage = '__REMOVE__'; preview('#bannerPreview', ''); };
$('#remove_pix').onclick = () => { pixQrImage = '__REMOVE__'; preview('#pixPreview', ''); };

$('#loginForm').onsubmit = async (event) => {
  event.preventDefault();
  const response = await fetch('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: $('#user').value, password: $('#pass').value }) });
  if (response.ok) showApp(); else alert('Login inválido');
};

$('#logout').onclick = async () => { await fetch('/api/admin/logout', { method: 'POST' }); location.reload(); };
$('#search').oninput = (event) => load(event.target.value);

async function saveTicket(number) {
  const body = {};
  document.querySelectorAll(`[data-n='${number}']`).forEach((element) => { body[element.dataset.f] = element.value; });
  const response = await fetch(`/api/admin/tickets/${number}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!response.ok) alert('Erro ao salvar');
  await load($('#search').value);
}

async function freeTicket(number) {
  if (!confirm('Liberar número e excluir reserva?')) return;
  await fetch(`/api/admin/tickets/${number}`, { method: 'DELETE' });
  await load($('#search').value);
}

$('#settingsForm').onsubmit = async (event) => {
  event.preventDefault();
  const response = await fetch('/api/admin/settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      live_link: $('#live_link').value,
      result_number: $('#result_number').value,
      result_winner: $('#result_winner').value,
      result_replay_link: $('#result_replay_link').value,
      pix_key: $('#pix_key').value,
      pix_receiver: $('#pix_receiver').value,
      banner_image: bannerImage,
      pix_qr_image: pixQrImage,
    }),
  });
  const result = await response.json();
  if (!response.ok) return alert(result.error || 'Erro ao salvar configurações.');
  bannerImage = '__KEEP__';
  pixQrImage = '__KEEP__';
  alert('Configurações salvas');
  await load();
};

check();
