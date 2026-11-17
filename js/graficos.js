/* Linhas Estatísticas — gráficos
 * Requer Chart.js 4 (UMD) e js/normalizar.js carregados antes.
 */
(function (global) {
  'use strict';

  var LE = (global.LE = global.LE || {});
  var S = LE.stats;

  var FONTE = document.documentElement.dataset.fonte || 'dados/dados.json';

  var COR_COMPANHIA = { GLO: '--cor-gol', TAM: '--cor-latam', AZU: '--cor-azul' };
  var COR_ROTA = { RIO: '--cor-rio', SAO: '--cor-sao' };

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

  /* Cor por entidade (companhia ou rota), nunca por índice. Token ausente é
     bug do CSS: cai em --ink para ficar visível, não em um hex inventado. */
  function corDe(token) {
    return cssVar(token, cssVar('--ink', 'currentColor'));
  }

  function corCompanhia(icao) { return corDe(COR_COMPANHIA[icao]); }
  function corRota(sigla) { return corDe(COR_ROTA[sigla]); }

  function tinta() {
    return {
      texto: cssVar('--ink', 'currentColor'),
      fraca: cssVar('--mute', 'currentColor'),
      grade: cssVar('--rule', 'currentColor'),
      fundo: cssVar('--surface', 'currentColor')
    };
  }

  /* Rótulo direto no fim de cada linha. Não é enfeite: é a codificação
     secundária que garante identidade sem depender só de cor. */
  var rotuloDireto = {
    id: 'rotuloDireto',
    afterDatasetsDraw: function (chart) {
      if (chart.config.type !== 'line') return;
      var ctx = chart.ctx;
      var t = tinta();
      ctx.save();
      ctx.font = '600 12px system-ui, sans-serif';
      ctx.textBaseline = 'middle';
      chart.data.datasets.forEach(function (ds, i) {
        var meta = chart.getDatasetMeta(i);
        if (meta.hidden) return;
        for (var p = meta.data.length - 1; p >= 0; p--) {
          var ponto = meta.data[p];
          if (ds.data[p] === null || ds.data[p] === undefined) continue;
          // Cor só na marca; o texto fica em tinta (--ink).
          ctx.fillStyle = ds.borderColor;
          ctx.fillRect(ponto.x + 8, ponto.y - 1, 12, 2);
          ctx.fillStyle = t.texto;
          ctx.fillText(ds.label, ponto.x + 24, ponto.y);
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
    var rota = dados.rotas[sigla];
    var opcoes = base(t);

    opcoes.layout = { padding: { right: 88 } };   // espaço para o rótulo direto
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
        datasets: rota.passagens.companhias.map(function (c) {
          var cor = corCompanhia(c.icao);
          return {
            label: c.nome,
            data: c.precos,               // null vira buraco na linha, não mergulho
            borderColor: cor,
            backgroundColor: cor,
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

  /* (máxima + mínima) / 2 por mês; mês sem uma das duas fica null. */
  function mediaMensal(c) {
    return c.temp_max.map(function (mx, i) {
      var mn = c.temp_min[i];
      return mx === null || mn === null || mx === undefined || mn === undefined ? null : (mx + mn) / 2;
    });
  }

  function temperatura(canvas, dados) {
    var t = tinta();
    var opcoes = base(t);

    opcoes.layout = { padding: { right: 88 } };
    opcoes.scales = eixos(t, 'Temperatura média (°C)', function (v) { return v + '°'; });
    opcoes.plugins.tooltip.callbacks = {
      label: function (item) { return item.dataset.label + ': ' + S.numero(item.parsed.y) + ' °C'; }
    };

    return registrar(canvas, {
      type: 'line',
      data: {
        labels: dados.meses,
        datasets: Object.keys(dados.rotas).map(function (sigla) {
          var cor = corRota(sigla);
          return {
            label: dados.rotas[sigla].cidade,
            data: mediaMensal(dados.rotas[sigla].clima),
            borderColor: cor,
            backgroundColor: cor,
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
    var opcoes = base(t);

    opcoes.scales = eixos(t, 'Precipitação (mm)', function (v) { return v + ' mm'; });
    opcoes.plugins.tooltip.callbacks = {
      label: function (item) { return item.dataset.label + ': ' + S.numero(item.parsed.y, 0) + ' mm'; }
    };

    return registrar(canvas, {
      type: 'bar',
      data: {
        labels: dados.meses,
        datasets: Object.keys(dados.rotas).map(function (sigla) {
          var cor = corRota(sigla);
          return {
            label: dados.rotas[sigla].cidade,
            data: dados.rotas[sigla].clima.precipitacao,
            backgroundColor: cor,
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

    return registrar(canvas, {
      type: 'radar',
      data: {
        labels: S.EIXOS_RADAR,
        datasets: Object.keys(dados.rotas).map(function (sigla) {
          var cor = corRota(sigla);
          return {
            label: dados.rotas[sigla].cidade,
            data: S.perfilRadar(dados, sigla),
            borderColor: cor,
            backgroundColor: cor + '22',
            borderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 8,
            pointBackgroundColor: cor,
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

  function todoNulo(lista) {
    return !lista.some(function (v) { return v !== null && v !== undefined; });
  }

  /* Troca o conteúdo da caixa do gráfico por um aviso, sem desenhar vazio. */
  function mostrarVazio(canvas, texto) {
    if (graficos[canvas.id]) { graficos[canvas.id].destroy(); delete graficos[canvas.id]; }
    var caixa = canvas.parentElement;
    caixa.textContent = '';
    var p = document.createElement('p');
    p.className = 'grafico-vazio';
    p.textContent = texto;
    caixa.appendChild(p);
  }

  function comDados(vazio, texto, desenhar) {
    return function (c, d) {
      if (vazio(d)) { mostrarVazio(c, texto); return; }
      desenhar(c, d);
    };
  }

  function semClima(d) {
    return Object.keys(d.rotas).every(function (k) {
      var cl = d.rotas[k].clima;
      return todoNulo(cl.temp_max) || todoNulo(cl.temp_min);
    });
  }
  function semChuva(d) {
    return Object.keys(d.rotas).every(function (k) { return todoNulo(d.rotas[k].clima.precipitacao); });
  }
  function semPrecos(sigla) {
    return function (d) {
      return d.rotas[sigla].passagens.companhias.every(function (c) { return todoNulo(c.precos); });
    };
  }
  function semRadar(d) {
    return Object.keys(d.rotas).every(function (k) { return todoNulo(S.perfilRadar(d, k)); });
  }

  var TELAS = [
    ['#grafico-precos-rio', comDados(semPrecos('RIO'), 'Preços ainda não coletados.', function (c, d) { precos(c, d, 'RIO'); })],
    ['#grafico-precos-sao', comDados(semPrecos('SAO'), 'Preços ainda não coletados.', function (c, d) { precos(c, d, 'SAO'); })],
    ['#grafico-temperatura', comDados(semClima, 'Dados de clima ainda não coletados.', temperatura)],
    ['#grafico-precipitacao', comDados(semChuva, 'Dados de clima ainda não coletados.', precipitacao)],
    ['#grafico-radar', comDados(semRadar, 'Dados ainda não coletados.', radar)]
  ];

  var ICONE_ALERTA = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" '
    + 'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
    + '<path d="M12 3 2 20h20L12 3z"/><path d="M12 10v4"/><path d="M12 17.5v.01"/></svg>';

  function faixaPendencias(dados) {
    var pend = dados.pendencias || [];
    if (!pend.length && !dados._aviso) return;
    var main = document.querySelector('main');
    if (!main || main.querySelector('.faixa-pendencias')) return;
    var faixa = document.createElement('div');
    faixa.className = 'faixa-pendencias';
    faixa.setAttribute('role', 'status');
    faixa.innerHTML = ICONE_ALERTA;
    var span = document.createElement('span');
    span.textContent = 'Dados provisórios: ' + (dados._aviso || 'faltam ' + pend.join(', '));
    faixa.appendChild(span);
    main.insertBefore(faixa, main.firstChild);
  }

  var MSG_ERRO = 'Os dados não carregaram. Abra o site por um servidor local: python -m http.server 8000';

  function falhou(erro) {
    console.error('[graficos]', erro);
    document.querySelectorAll('[data-grafico]').forEach(function (el) { el.textContent = MSG_ERRO; });
    var main = document.querySelector('main');
    if (main && !main.querySelector('.faixa-pendencias')) {
      var faixa = document.createElement('div');
      faixa.className = 'faixa-pendencias';
      faixa.setAttribute('role', 'alert');
      var span = document.createElement('span');
      span.textContent = MSG_ERRO;
      faixa.appendChild(span);
      main.insertBefore(faixa, main.firstChild);
    }
  }

  function iniciar() {
    fetch(FONTE)
      .then(function (r) {
        if (!r.ok) throw new Error('Não foi possível ler ' + FONTE + ' (HTTP ' + r.status + ')');
        return r.json();
      })
      .then(function (dados) {
        LE.dados = dados;
        faixaPendencias(dados);
        document.dispatchEvent(new CustomEvent('le:dados', { detail: dados }));

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
      .catch(falhou);
  }

  LE.graficos = { iniciar: iniciar, instancias: graficos };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
})(window);