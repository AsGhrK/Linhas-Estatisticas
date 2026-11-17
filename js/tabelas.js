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
  var VAZIO_LISTA = 'Ainda não coletado.';
  var MESES_ABREV = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  var MESES_EXTENSO = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho',
    'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

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

  /* "2026-01" -> "jan. de 2026". Outro formato volta como texto. */
  function periodo(valor) {
    var m = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(String(valor));
    return m ? MESES_ABREV[Number(m[2]) - 1] + '. de ' + m[1] : String(valor);
  }

  /* "ago" -> "agosto". Abreviação desconhecida volta como texto. */
  function mes(valor) {
    var i = MESES_ABREV.indexOf(String(valor));
    return i < 0 ? String(valor) : MESES_EXTENSO[i];
  }

  function formatar(valor, formato) {
    if (valor === null || valor === undefined) return VAZIO;
    switch (formato) {
      case 'moeda': return S.moeda(valor);
      case 'numero': return S.numero(valor, 1);
      case 'porcentagem': return S.porcentagem(valor);
      case 'inteiro': return valor.toLocaleString('pt-BR', { maximumFractionDigits: 0 });
      case 'periodo': return periodo(valor);
      case 'mes': return mes(valor);
      default: return String(valor);
    }
  }

  function escrever(el, valor, caminho) {
    if (valor === undefined) {
      console.warn('[tabelas] caminho inexistente no JSON:', caminho);
      el.textContent = VAZIO;
      return;
    }
    el.textContent = formatar(valor, el.getAttribute('data-formato') || 'texto');
  }

  /* Dentro de um item da lista, "." é o item e ".nome" é item.nome. */
  function preencherItem(raiz, item) {
    var alvos = [raiz].concat(Array.prototype.slice.call(raiz.querySelectorAll('[data-campo]')));
    alvos.forEach(function (el) {
      var caminho = el.getAttribute('data-campo');
      if (caminho === null || caminho.charAt(0) !== '.') return;
      escrever(el, caminho === '.' ? item : resolver(item, caminho.slice(1)), caminho);
    });
  }

  function preencherLista(el, dados) {
    var modelo = el.querySelector('template');
    if (!modelo) {
      console.warn('[tabelas] data-lista sem <template>:', el.getAttribute('data-lista'));
      return;
    }
    Array.prototype.slice.call(el.children).forEach(function (filho) {
      if (filho.hasAttribute('data-lista-gerado')) filho.remove();
    });
    var itens = resolver(dados, el.getAttribute('data-lista'));
    if (!Array.isArray(itens) || !itens.length) {
      var tag = el.tagName === 'UL' || el.tagName === 'OL' ? 'li' : 'p';
      var vazio = document.createElement(tag);
      vazio.className = 'lista-vazia';
      vazio.setAttribute('data-lista-gerado', '');
      vazio.textContent = el.getAttribute('data-vazio') || VAZIO_LISTA;
      el.insertBefore(vazio, modelo);
      return;
    }
    itens.forEach(function (item) {
      Array.prototype.slice.call(modelo.content.cloneNode(true).children).forEach(function (clone) {
        clone.setAttribute('data-lista-gerado', '');
        preencherItem(clone, item);
        el.insertBefore(clone, modelo);
      });
    });
  }

  function preencher(raiz) {
    var dados = LE.dados;
    if (!dados) return;
    var base = raiz || document;
    base.querySelectorAll('[data-lista]').forEach(function (el) { preencherLista(el, dados); });
    base.querySelectorAll('[data-campo]').forEach(function (el) {
      var caminho = el.getAttribute('data-campo');
      if (caminho.charAt(0) === '.') return; /* campo de item: já preenchido pela lista */
      escrever(el, resolver(dados, caminho), caminho);
    });
  }

  LE.tabelas = { resolver: resolver, formatar: formatar, preencher: preencher };

  document.addEventListener('le:dados', function (e) {
    if (e.detail && !LE.dados) LE.dados = e.detail;
    preencher(document);
  });
})(window);
