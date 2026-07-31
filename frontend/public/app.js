const state = { selected: new Set(), data: null };
const $ = (selector) => document.querySelector(selector);
const statusText = { available: 'Disponível', reserved: 'Reservado', sold: 'Vendido' };

async function load() {
  const response = await fetch('/api/raffle');
  state.data = await response.json();
  render();
}

function safeLink(url) {
  return /^https?:\/\//i.test(url || '') ? url : '';
}

function render() {
  const { raffle, settings, summary, tickets, ticketPrice } = state.data;
  const total = tickets.length;
  const percent = total ? Math.round((summary.sold / total) * 100) : 0;

  $('#title').textContent = raffle.title;
  $('#draw').textContent = new Date(`${raffle.drawDate}T00:00:00`).toLocaleDateString('pt-BR');
  $('#available').textContent = summary.available;
  $('#reserved').textContent = summary.reserved;
  $('#sold').textContent = summary.sold;
  $('#raised').textContent = Number(summary.raised || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  $('#progress').style.width = `${percent}%`;
  $('#progressLabel').textContent = `${percent}% vendido`;
  $('#priceInfo').textContent = ticketPrice > 0 ? `Valor por número: ${Number(ticketPrice).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}` : 'Valor por número informado pelo organizador.';

  $('#banner').innerHTML = settings.banner_image
    ? `<img src="${settings.banner_image}" alt="Banner da rifa">`
    : '<strong>Banner principal</strong><span>Imagem poderá ser enviada pelo painel administrativo</span>';

  $('#ticketGrid').innerHTML = tickets.map((ticket) => `
    <button class="ticket ${ticket.status}" ${ticket.status === 'available' ? '' : 'disabled'} data-n="${ticket.number}" aria-label="Número ${ticket.number} ${statusText[ticket.status]}">
      <span>${ticket.number}</span><small>${statusText[ticket.status]}</small>
    </button>
  `).join('');

  $('#pixArea').innerHTML = settings.pix_key || settings.pix_receiver || settings.pix_qr_image ? `
    <div class="payment-card">
      ${settings.pix_qr_image ? `<img class="qr" src="${settings.pix_qr_image}" alt="QR Code PIX">` : ''}
      <div><h3>Pagamento via PIX</h3><p><b>Recebedor:</b> ${settings.pix_receiver || '-'}</p><p><b>Chave PIX:</b> ${settings.pix_key || '-'}</p></div>
    </div>
  ` : '<p>Dados de pagamento PIX serão informados pelo organizador.</p>';

  const liveLink = safeLink(settings.live_link);
  $('#liveArea').innerHTML = liveLink
    ? `<a class="btn secondary" target="_blank" rel="noopener" href="${liveLink}">Assistir ao Vivo</a>`
    : '<p>Link da transmissão será disponibilizado no dia do sorteio.</p>';

  const replay = safeLink(settings.result_replay_link);
  const hasResult = settings.result_number || settings.result_winner || replay;
  $('#resultArea').innerHTML = hasResult ? `
    <h3>Resultado</h3>
    <p><b>Número sorteado:</b> ${settings.result_number || '-'}</p>
    <p><b>Ganhador:</b> ${settings.result_winner || '-'}</p>
    ${replay ? `<a class="btn ghost" target="_blank" rel="noopener" href="${replay}">Assistir novamente</a>` : ''}
  ` : '<p>Resultado será divulgado após o sorteio.</p>';
}

document.addEventListener('click', (event) => {
  const button = event.target.closest('.ticket.available');
  if (!button) return;
  const number = Number(button.dataset.n);
  state.selected.has(number) ? state.selected.delete(number) : state.selected.add(number);
  button.classList.toggle('selected');
  $('#chosen').textContent = [...state.selected].sort().join(', ') || 'Nenhum';
});

$('#reserveForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const numbers = [...state.selected].sort();
  if (!numbers.length) return alert('Escolha ao menos um número.');

  const payload = { name: $('#name').value, phone: $('#phone').value, note: $('#note').value, numbers };
  const response = await fetch('/api/reserve', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  const result = await response.json();
  if (!response.ok) return alert(result.error);

  const message = encodeURIComponent(`Olá! Quero reservar números da rifa.\n\nNome: ${payload.name}\nTelefone: ${payload.phone}\nObservação: ${payload.note || '-'}\nNúmeros: ${numbers.join(', ')}\n\nChave PIX: ${state.data.settings.pix_key || '-'}`);
  window.open(`https://wa.me/${state.data.raffle.whatsapp}?text=${message}`, '_blank');
  state.selected.clear();
  event.target.reset();
  $('#chosen').textContent = 'Nenhum';
  await load();
});

$('#consultForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const response = await fetch(`/api/consult?phone=${encodeURIComponent($('#consultPhone').value)}`);
  const result = await response.json();
  $('#consultResult').style.display = 'block';
  $('#consultResult').innerHTML = result.tickets?.length
    ? result.tickets.map((ticket) => `<p><b>${ticket.number}</b> - ${statusText[ticket.status]}</p>`).join('')
    : 'Nenhum número encontrado para este telefone.';
});

$('#shareButton').addEventListener('click', () => {
  const text = encodeURIComponent(`Participe da ${state.data.raffle.title}! Escolha seu número em ${location.origin}`);
  window.open(`https://wa.me/?text=${text}`, '_blank');
});

load();
