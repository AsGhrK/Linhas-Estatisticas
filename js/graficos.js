(function () {
  'use strict';

  const canvas = document.getElementById('grafico-precos-sbrj');
  if (!canvas || typeof Chart === 'undefined') return;

  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  // Dados provisórios até LE-11 (extração real do painel ANAC) preencher o dados.json.
  const tarifas = {
    Gol: [412, 398, 405, 430, 455, 470, 520, 505, 460, 440, 480, 610],
    LATAM: [430, 415, 420, 448, 468, 480, 535, 512, 470, 452, 495, 625],
    Azul: [399, 390, 395, 418, 440, 452, 500, 490, 445, 428, 465, 590],
    Voepass: [355, 348, 352, 370, 388, 402, 445, 430, 398, 382, 410, 520],
  };

  const raiz = getComputedStyle(document.documentElement);
  const cor = (nome) => raiz.getPropertyValue(nome).trim();
  const paleta = [cor('--azul'), cor('--ciano'), cor('--ambar'), cor('--mute')];
  const linhaGrade = cor('--rule');
  const corTexto = cor('--mute');

  const datasets = Object.entries(tarifas).map(([companhia, valores], i) => ({
    label: companhia,
    data: valores,
    borderColor: paleta[i % paleta.length],
    backgroundColor: paleta[i % paleta.length],
    borderWidth: 2,
    pointRadius: 3,
    pointHoverRadius: 5,
    tension: 0.25,
    fill: false,
  }));

  // Camada estatística (normalizar.js) alimentando o rodapé do tooltip.
  const resumo = Object.fromEntries(
    Object.entries(tarifas).map(([companhia, valores]) => [
      companhia,
      window.Estatistica
        ? {
            media: window.Estatistica.media(valores),
            cv: window.Estatistica.coeficienteVariacao(valores),
          }
        : null,
    ])
  );

  new Chart(canvas.getContext('2d'), {
    type: 'line',
    data: { labels: meses, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      scales: {
        x: { grid: { color: linhaGrade }, ticks: { color: corTexto } },
        y: {
          grid: { color: linhaGrade },
          ticks: { color: corTexto, callback: (v) => `R$ ${v}` },
        },
      },
      plugins: {
        legend: { labels: { color: corTexto } },
        tooltip: {
          callbacks: {
            afterBody: (itens) => {
              const r = resumo[itens[0].dataset.label];
              return r ? [`Média: R$ ${r.media.toFixed(0)}`, `CV: ${r.cv.toFixed(1)}%`] : [];
            },
          },
        },
      },
    },
  });
})();
