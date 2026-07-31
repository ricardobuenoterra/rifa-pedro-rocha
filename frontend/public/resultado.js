const $ = (selector) => document.querySelector(selector);
function safeLink(url) { return /^https?:\/\//i.test(url || '') ? url : ''; }

fetch('/api/raffle')
  .then((response) => response.json())
  .then(({ settings }) => {
    $('#banner').innerHTML = settings.banner_image
      ? `<img src="${settings.banner_image}" alt="Banner da rifa">`
      : '<strong>Banner principal</strong><span>Imagem poderá ser enviada pelo painel administrativo</span>';

    const replay = safeLink(settings.result_replay_link);
    const live = safeLink(settings.live_link);
    $('#resultPage').innerHTML = `
      <h2>Número sorteado</h2>
      <p class="winner-number">${settings.result_number || 'Aguardando sorteio'}</p>
      <h2>Nome do ganhador</h2>
      <p class="winner-name">${settings.result_winner || 'Resultado ainda não cadastrado.'}</p>
      ${replay ? `<a class="btn secondary" target="_blank" rel="noopener" href="${replay}">Assistir novamente ao sorteio</a>` : '<p>O link de replay será disponibilizado após o sorteio.</p>'}
    `;
    $('#liveArea').innerHTML = live
      ? `<a class="btn secondary" target="_blank" rel="noopener" href="${live}">Assistir ao Vivo</a>`
      : '<p>Link da transmissão será disponibilizado no dia do sorteio.</p>';
  });
