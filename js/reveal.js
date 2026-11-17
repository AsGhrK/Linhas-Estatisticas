/*
  Revelação na entrada da tela (Linhas Estatísticas).

  - Marca <html class="js">: o estado inicial invisível de [data-revelar]
    só vale com JS ligado (ver css/animacoes.css). Se o script falhar, o
    conteúdo continua visível.
  - Todo [data-revelar] ganha .visivel quando entra na tela.
  - LE.aoRevelar(seletor, fn) chama fn(el) uma vez, quando o primeiro
    elemento que casa com o seletor entra na tela. O js/graficos.js usa
    isso para montar cada gráfico só quando ele aparece.
  - Com prefers-reduced-motion ou sem IntersectionObserver, tudo acontece
    na hora.
*/
(function () {
  'use strict';

  document.documentElement.classList.add('js');

  var LE = window.LE = window.LE || {};

  var reduzMovimento = !!(window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var temObservador = 'IntersectionObserver' in window;
  var LIMIAR = 0.12;

  /* Chama fn(el) uma vez, quando el entra na tela. */
  function quandoEntrar(el, fn) {
    if (reduzMovimento || !temObservador) { fn(el); return; }
    var observador = new IntersectionObserver(function (entradas) {
      for (var i = 0; i < entradas.length; i++) {
        if (entradas[i].isIntersecting) {
          observador.disconnect();
          fn(el);
          return;
        }
      }
    }, { threshold: LIMIAR });
    observador.observe(el);
  }

  if (typeof LE.aoRevelar !== 'function') {
    LE.aoRevelar = function (seletor, fn) {
      var el = document.querySelector(seletor);
      if (el) quandoEntrar(el, fn);
    };
  }

  function revelarSecoes() {
    var alvos = document.querySelectorAll('[data-revelar]');
    for (var i = 0; i < alvos.length; i++) {
      quandoEntrar(alvos[i], function (el) { el.classList.add('visivel'); });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', revelarSecoes);
  } else {
    revelarSecoes();
  }
})();
