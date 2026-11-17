/* Linhas Estatísticas — campos ligados ao JSON
 * Preenche todo [data-campo="caminho.no.json"] quando js/graficos.js
 * dispara 'le:dados'. Não carrega dados por conta própria.
 * Exposto em window.LE.tabelas.
 */
(function (global) {
  'use strict';

  var LE = (global.LE = global.LE || {});
  var S = LE.stats;
  var VAZIO = '—';

  /* Caminho com pontos; segmento numérico indexa array. */
  function resolver(dados, caminho) {
    var atual = dados;
    var partes = String(caminho).split('.');
    for (var i = 0; i < partes.length; i++) {
      if (atual === null || atual === undefined || typeof atual !== 'object') return undefined;
      if (!Object.prototype.hasOwnProperty.call(atual, partes[i])) return undefined;
      atual = atual[partes[i]];
    }
    return atual;
  }

  function formatar(valor, formato) {
    if (valor === null || valor === undefined) return VAZIO;
    switch (formato) {
      case 'moeda': return S.moeda(valor);
      case 'numero': return S.numero(valor, 1);
      case 'porcentagem': return S.porcentagem(valor);
      case 'inteiro': return valor.toLocaleString('pt-BR', { maximumFractionDigits: 0 });
      default: return String(valor);
    }
  }

  function preencher(raiz) {
    var dados = LE.dados;
    if (!dados) return;
    var base = raiz || document;
    base.querySelectorAll('[data-campo]').forEach(function (el) {
      var caminho = el.getAttribute('data-campo');
      var valor = resolver(dados, caminho);
      if (valor === undefined) {
        console.warn('[tabelas] caminho inexistente no JSON:', caminho);
        el.textContent = VAZIO;
        return;
      }
      el.textContent = formatar(valor, el.getAttribute('data-formato') || 'texto');
    });
  }

  LE.tabelas = { resolver: resolver, formatar: formatar, preencher: preencher };

  document.addEventListener('le:dados', function (e) {
    if (e.detail && !LE.dados) LE.dados = e.detail;
    preencher(document);
  });
})(window);
