/* Linhas Estatísticas — gráficos
 * Requer Chart.js 4 (UMD) e js/normalizar.js carregados antes.
 */
(function (global) {
  'use strict';

  var LE = (global.LE = global.LE || {});
  var S = LE.stats;

  var FONTE = 'dados/dados-falsos.json';   // trocar para 'dados/dados.json'

  /* Paleta validada: banda de luminosidade, piso de croma, separação para
     daltonismo (ΔE 10.6 claro / 10.3 escuro) e contraste contra o fundo. */
  var PALETA = {
    claro:  ['#1F6FB2', '#BC6116', '#0A8B6E'],
    escuro: ['#4E9BD8', '#C4762F', '#2E9C7F']
  };

  function temaEscuro() {
    var stamp = document.documentElement.getAttribute('data-theme');
    if (stamp === 'dark') return true;
    if (stamp === 'light') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  function cssVar(nome, alternativa) {
    var v = getComputedStyle(document.documentElement).getPropertyValue(nome).trim();
    return v || alternativa;
  }

  function series() {
    var base = temaEscuro() ? PALETA.escuro : PALETA.claro;
    return base.map(function (cor, i) {
      return cssVar('--serie-' + (i + 1), cor);
    });
  }

  function tinta() {
    return {
      texto: cssVar('--ink', temaEscuro() ? '#E6ECF3' : '#0E1A2B'),
      fraca: cssVar('--mute', temaEscuro() ? '#94A4B6' : '#5B6B7F'),
      grade: cssVar('--rule', temaEscuro() ? '#25333F' : '#D6DEE7'),
      fundo: cssVar('--surface', temaEscuro() ? '#131D28' : '#FFFFFF')
    };
  }

  /* Rótulo direto no fim de cada linha. Não é enfeite: é a codificação
     secundária que garante identidade sem depender só de cor. */
  var rotuloDireto = {
    id: 'rotuloDireto',
    afterDatasetsDraw: function (chart) {
      if (chart.config.type !== 'line') return;
      var ctx = chart.ctx;
      ctx.save();
      ctx.font = '600 12px system-ui, sans-serif';
      ctx.textBaseline = 'middle';
      chart.data.datasets.forEach(function (ds, i) {
        var meta = chart.getDatasetMeta(i);
        if (meta.hidden) return;
        for (var p = meta.data.length - 1; p >= 0; p--) {
          var ponto = meta.data[p];
          if (ds.data[p] === null || ds.data[p] === undefined) continue;
          ctx.fillStyle = ds.borderColor;
          ctx.fillText(ds.label, ponto.x + 10, ponto.y);
          break;
        }
      });
      ctx.restore();
    }
  };

  function eixos(t, rotuloY, formatador) {
    return {
      x: {
        grid: { display: false },
        border: { color: t.grade },
        ticks: { color: t.fraca, font: { size: 12 } }
      },
      y: {
        title: { display: true, text: rotuloY, color: t.fraca, font: { size: 12 } },
        grid: { color: t.grade, drawTicks: false },
        border: { display: false },
        ticks: { color: t.fraca, font: { size: 12 }, padding: 8, callback: formatador }
      }
    };
  }

  function base(t) {
    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          position: 'top',
          align: 'start',
          labels: { color: t.texto, boxWidth: 10, boxHeight: 10, usePointStyle: true, padding: 16 }
        },
        tooltip: {
          backgroundColor: t.fundo,
          titleColor: t.texto,
          bodyColor: t.texto,
          borderColor: t.grade,
          borderWidth: 1,
          padding: 12,
          displayColors: true,
          boxWidth: 8,
          boxHeight: 8,
          usePointStyle: true
        }
      }
    };
  }

  var graficos = {};

  function registrar(canvas, config) {
    if (graficos[canvas.id]) graficos[canvas.id].destroy();
    graficos[canvas.id] = new Chart(canvas, config);
    return graficos[canvas.id];
  }

  /* ---------- 1 e 2. Preço mensal por companhia, um gráfico por rota ---------- */

  function precos(canvas, dados, sigla) {
    var t = tinta();
    var cor = series();
    var rota = dados.rotas[sigla];
    var opcoes = base(t);

    opcoes.layout = { padding: { right: 64 } };   // espaço para o rótulo direto
    opcoes.scales = eixos(t, 'Tarifa (R$)', function (v) {
      return 'R$ ' + v.toLocaleString('pt-BR');
    });
    opcoes.plugins.tooltip.callbacks = {
      label: function (item) { return item.dataset.label + ': ' + S.moeda(item.parsed.y); }
    };

    return registrar(canvas, {
      type: 'line',
      data: {
        labels: dados.meses,
        datasets: rota.passagens.companhias.map(function (c, i) {
          return {
            label: c.nome,
            data: c.precos,               // null vira buraco na linha, não mergulho
            borderColor: cor[i],
            backgroundColor: cor[i],
            borderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 8,
            pointBorderColor: t.fundo,    // anel de 2px separa marcas sobrepostas
            pointBorderWidth: 2,
            tension: 0.25,
            spanGaps: false
          };
        })
      },
      options: opcoes,
      plugins: [rotuloDireto]
    });
  }

  /* ---------- 3. Temperatura média mensal, duas cidades ---------- */

  function temperatura(canvas, dados) {
    var t = tinta();
    var cor = series();
    var opcoes = base(t);

    opcoes.layout = { padding: { right: 64 } };
    opcoes.scales = eixos(t, 'Temperatura máxima média (°C)', function (v) { return v + '°'; });
    opcoes.plugins.tooltip.callbacks = {
      label: function (item) { return item.dataset.label + ': ' + S.numero(item.parsed.y) + ' °C'; }
    };

    return registrar(canvas, {
      type: 'line',
      data: {
        labels: dados.meses,
        datasets: Object.keys(dados.rotas).map(function (sigla, i) {
          return {
            label: dados.rotas[sigla].cidade,
            data: dados.rotas[sigla].clima.temp_max,
            borderColor: cor[i],
            backgroundColor: cor[i],
            borderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 8,
            pointBorderColor: t.fundo,
            pointBorderWidth: 2,
            tension: 0.3
          };
        })
      },
      options: opcoes,
      plugins: [rotuloDireto]
    });
  }

  /* ---------- 4. Precipitação mensal, duas cidades ----------
     Gráfico separado de propósito. Chuva e temperatura no mesmo desenho
     exigiriam dois eixos Y, e duas escalas arbitrárias deixam o autor
     escolher onde as curvas se cruzam. */

  function precipitacao(canvas, dados) {
    var t = tinta();
    var cor = series();
    var opcoes = base(t);

    opcoes.scales = eixos(t, 'Precipitação (mm)', function (v) { return v + ' mm'; });
    opcoes.plugins.tooltip.callbacks = {
      label: function (item) { return item.dataset.label + ': ' + S.numero(item.parsed.y, 0) + ' mm'; }
    };

    return registrar(canvas, {
      type: 'bar',
      data: {
        labels: dados.meses,
        datasets: Object.keys(dados.rotas).map(function (sigla, i) {
          return {
            label: dados.rotas[sigla].cidade,
            data: dados.rotas[sigla].clima.precipitacao,
            backgroundColor: cor[i],
            borderRadius: { topLeft: 4, topRight: 4 },  // ponta arredondada, base ancorada
            borderSkipped: 'bottom',
            borderColor: t.fundo,
            borderWidth: { top: 0, right: 1, bottom: 0, left: 1 },  // respiro de 2px
            barPercentage: 0.78,
            categoryPercentage: 0.72
          };
        })
      },
      options: opcoes
    });
  }

  /* ---------- 5. Radar comparativo ---------- */

  function radar(canvas, dados) {
    var t = tinta();
    var cor = series();

    return registrar(canvas, {
      type: 'radar',
      data: {
        labels: S.EIXOS_RADAR,
        datasets: Object.keys(dados.rotas).map(function (sigla, i) {
          return {
            label: dados.rotas[sigla].cidade,
            data: S.perfilRadar(dados, sigla),
            borderColor: cor[i],
            backgroundColor: cor[i] + '22',
            borderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 8,
            pointBackgroundColor: cor[i],
            pointBorderColor: t.fundo,
            pointBorderWidth: 2
          };
        })
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          r: {
            min: 0,
            max: 1,
            angleLines: { color: t.grade },
            grid: { color: t.grade },
            pointLabels: { color: t.texto, font: { size: 13, weight: '600' } },
            ticks: {
              stepSize: 0.25,
              color: t.fraca,
              backdropColor: 'transparent',
              callback: function (v) { return v.toFixed(2).replace('.', ','); }
            }
          }
        },
        plugins: {
          legend: {
            position: 'top',
            align: 'start',
            labels: { color: t.texto, boxWidth: 10, boxHeight: 10, usePointStyle: true, padding: 16 }
          },
          tooltip: {
            backgroundColor: t.fundo,
            titleColor: t.texto,
            bodyColor: t.texto,
            borderColor: t.grade,
            borderWidth: 1,
            padding: 12,
            callbacks: {
              label: function (item) {
                return item.dataset.label + ': ' + item.parsed.r.toFixed(2).replace('.', ',') + ' / 1,00';
              }
            }
          }
        }
      }
    });
  }

  /* ---------- montagem ---------- */

  /* Se P2 já publicou o reveal.js, espera a animação terminar.
     Se ainda não, monta na hora. Ninguém fica bloqueado. */
  function quandoAparecer(seletor, fn) {
    if (LE.aoRevelar) { LE.aoRevelar(seletor, fn); return; }
    var el = document.querySelector(seletor);
    if (el) fn(el);
  }

  function canvasDe(el) {
    return el.tagName === 'CANVAS' ? el : el.querySelector('canvas');
  }

  var TELAS = [
    ['#grafico-precos-sbrj', function (c, d) { precos(c, d, 'SBRJ'); }],
    ['#grafico-precos-sbsp', function (c, d) { precos(c, d, 'SBSP'); }],
    ['#grafico-temperatura', temperatura],
    ['#grafico-precipitacao', precipitacao],
    ['#grafico-radar', radar]
  ];

  function iniciar() {
    fetch(FONTE)
      .then(function (r) {
        if (!r.ok) throw new Error('Não foi possível ler ' + FONTE + ' (HTTP ' + r.status + ')');
        return r.json();
      })
      .then(function (dados) {
        LE.dados = dados;

        TELAS.forEach(function (par) {
          quandoAparecer(par[0], function (el) {
            var c = canvasDe(el);
            if (c) par[1](c, dados);
          });
        });

        // Troca de tema: redesenha com as cores do tema novo.
        window.matchMedia('(prefers-color-scheme: dark)')
          .addEventListener('change', function () {
            TELAS.forEach(function (par) {
              var el = document.querySelector(par[0]);
              var c = el && canvasDe(el);
              if (c && graficos[c.id]) par[1](c, dados);
            });
          });
      })
      .catch(function (erro) {
        console.error('[graficos]', erro);
        document.querySelectorAll('[data-grafico]').forEach(function (el) {
          el.textContent = 'Dados indisponíveis. Rode o site por um servidor local — '
            + 'fetch não funciona abrindo o arquivo direto do disco.';
        });
      });
  }

  LE.graficos = { iniciar: iniciar, instancias: graficos };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
})(window);