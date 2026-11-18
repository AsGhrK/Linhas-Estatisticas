/* Linhas Estatísticas — cidades em comparação
 * O estudo tem dez destinos; os gráficos, o radar e as seções por cidade
 * mostram até MAX deles de cada vez. A escolha vale para todas as telas:
 * fica na URL (?cidades=RIO,SAO) e, quando o navegador deixa, no
 * localStorage. ?destino=XXX, vindo da busca da página inicial, entra
 * primeiro. Exposto em window.LE.selecao; dispara 'le:selecao' ao mudar.
 */
(function (global) {
  'use strict';

  var LE = (global.LE = global.LE || {});
  var MAX = 4;
  var PADRAO = ['RIO', 'SAO'];
  var CHAVE_LOCAL = 'le:cidades';

  /* Função pura: as chaves válidas, sem repetição, no máximo MAX, com o
     destino na frente. Lista vazia cai no padrão. */
  function normalizar(lista, validas, destino) {
    var saida = [];
    [destino].concat(lista || []).forEach(function (k) {
      if (k && validas.indexOf(k) !== -1 && saida.indexOf(k) === -1) saida.push(k);
    });
    if (!saida.length) saida = PADRAO.filter(function (k) { return validas.indexOf(k) !== -1; });
    if (!saida.length) saida = validas.slice(0, 2);
    return saida.slice(0, MAX);
  }

  /* Cópia rasa dos dados só com as rotas escolhidas, na ordem da escolha.
     As faixas continuam as do estudo inteiro: a nota de uma cidade não muda
     conforme as outras que estão na tela. */
  function filtrar(dados, chaves) {
    var rotas = {};
    chaves.forEach(function (k) { if (dados.rotas[k]) rotas[k] = dados.rotas[k]; });
    var copia = {};
    Object.keys(dados).forEach(function (k) { copia[k] = dados[k]; });
    copia.rotas = rotas;
    return copia;
  }

  LE.selecao = { MAX: MAX, normalizar: normalizar, filtrar: filtrar };

  var doc = global.document;
  if (!doc || !doc.querySelector) return;

  var atual = null;

  function lerLocal() {
    try { return (global.localStorage.getItem(CHAVE_LOCAL) || '').split(',').filter(Boolean); } catch (e) { return []; }
  }
  function gravarLocal(chaves) {
    try { global.localStorage.setItem(CHAVE_LOCAL, chaves.join(',')); } catch (e) { /* sem armazenamento: fica na URL */ }
  }

  function inicial(dados) {
    var params = new URLSearchParams(global.location.search);
    var daUrl = (params.get('cidades') || '').split(',').filter(Boolean);
    return normalizar(daUrl.length ? daUrl : lerLocal(), Object.keys(dados.rotas), params.get('destino'));
  }

  /* Leva a escolha nos links entre as telas, para valer mesmo sem localStorage. */
  function atualizarLinks(chaves) {
    doc.querySelectorAll('a[href$=".html"], a[href*=".html?"]').forEach(function (a) {
      var href = a.getAttribute('href');
      if (/^[a-z]+:/i.test(href) || href.indexOf('docs/') === 0) return;
      a.setAttribute('href', href.split('?')[0] + '?cidades=' + chaves.join(','));
    });
  }

  function aplicar(chaves) {
    atual = chaves;
    gravarLocal(chaves);
    var url = new URL(global.location.href);
    url.searchParams.set('cidades', chaves.join(','));
    url.searchParams.delete('destino');
    try { global.history.replaceState(null, '', url); } catch (e) { /* file:// */ }
    atualizarLinks(chaves);
  }

  function chaves(dados) {
    if (!atual && dados) aplicar(inicial(dados));
    return atual || PADRAO;
  }

  function desenharSeletor(el, dados) {
    el.textContent = '';
    var grupo = doc.createElement('fieldset');
    grupo.className = 'seletor-cidades';
    var legenda = doc.createElement('legend');
    legenda.textContent = 'Cidades em comparação (até ' + MAX + ')';
    grupo.appendChild(legenda);
    var lista = doc.createElement('div');
    lista.className = 'seletor-opcoes';
    Object.keys(dados.rotas).forEach(function (k) {
      var rotulo = doc.createElement('label');
      var caixa = doc.createElement('input');
      caixa.type = 'checkbox';
      caixa.value = k;
      caixa.checked = atual.indexOf(k) !== -1;
      caixa.disabled = !caixa.checked && atual.length >= MAX;
      var cor = doc.createElement('span');
      cor.className = 'seletor-cor';
      cor.style.background = 'var(--cor-' + k.toLowerCase() + ')';
      cor.setAttribute('aria-hidden', 'true');
      rotulo.appendChild(caixa);
      rotulo.appendChild(cor);
      rotulo.appendChild(doc.createTextNode(dados.rotas[k].cidade));
      lista.appendChild(rotulo);
    });
    grupo.appendChild(lista);
    el.appendChild(grupo);
  }

  function desenharSeletores(dados) {
    doc.querySelectorAll('[data-seletor-cidades]').forEach(function (el) { desenharSeletor(el, dados); });
  }

  doc.addEventListener('change', function (e) {
    var caixa = e.target;
    if (!caixa.closest || !caixa.closest('[data-seletor-cidades]') || !LE.dados) return;
    var escolhidas = atual.filter(function (k) { return k !== caixa.value; });
    if (caixa.checked) escolhidas.push(caixa.value);
    if (!escolhidas.length) { caixa.checked = true; return; }   // ao menos uma cidade
    aplicar(normalizar(escolhidas, Object.keys(LE.dados.rotas)));
    desenharSeletores(LE.dados);
    doc.dispatchEvent(new CustomEvent('le:selecao', { detail: atual }));
  });

  /* Registrado antes do js/graficos.js e do js/tabelas.js: a escolha já
     existe quando eles montam a tela. */
  doc.addEventListener('le:dados', function (e) {
    chaves(e.detail);
    desenharSeletores(e.detail);
  });

  LE.selecao.chaves = chaves;
  LE.selecao.daTela = function (dados) { return filtrar(dados, chaves(dados)); };
})(window);
