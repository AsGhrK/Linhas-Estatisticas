/* Linhas Estatísticas — cidades em comparação
 * O estudo tem dez destinos; os gráficos, o radar e as tabelas comparativas
 * mostram até MAX deles de cada vez. MAX é 3 porque só três cores da paleta
 * de séries ficam distinguíveis entre si em qualquer par, com daltonismo e
 * nos dois temas (validate_palette.js --pairs all).
 *
 * A escolha é uma lista de MAX posições; cada posição tem a sua cor
 * (--serie-1..3). Tirar uma cidade esvazia a posição dela e não repinta as
 * outras; a cidade nova ocupa a primeira posição livre. A escolha vale para
 * todas as telas: fica na URL (?cidades=RIO,,BSB) e, quando o navegador
 * deixa, no localStorage. ?destino=XXX, vindo da busca da página inicial,
 * entra numa posição livre. Exposto em window.LE.selecao; dispara
 * 'le:selecao' ao mudar.
 */
(function (global) {
  'use strict';

  var LE = (global.LE = global.LE || {});
  var MAX = 3;
  var PADRAO = ['RIO', 'SAO'];
  var CHAVE_LOCAL = 'le:cidades';

  /* Função pura: MAX posições, cada uma com uma sigla válida e única ou null.
     O destino entra na primeira posição livre (ou na última, se não houver).
     Sem nenhuma cidade, cai no padrão. */
  function normalizar(lista, validas, destino) {
    var pos = [];
    for (var i = 0; i < MAX; i++) {
      var k = (lista || [])[i];
      pos.push(k && validas.indexOf(k) !== -1 && pos.indexOf(k) === -1 ? k : null);
    }
    if (destino && validas.indexOf(destino) !== -1 && pos.indexOf(destino) === -1) {
      var livre = pos.indexOf(null);
      pos[livre === -1 ? MAX - 1 : livre] = destino;
    }
    if (pos.every(function (k) { return k === null; })) {
      var base = PADRAO.filter(function (k) { return validas.indexOf(k) !== -1; });
      if (!base.length) base = validas.slice(0, 2);
      pos = base.concat([null, null, null]).slice(0, MAX);
    }
    return pos;
  }

  /* As siglas escolhidas, na ordem das posições, sem os vazios. */
  function siglas(pos) { return pos.filter(function (k) { return k !== null; }); }

  /* Cópia rasa dos dados só com as rotas escolhidas. As faixas continuam as
     do estudo inteiro: a nota de uma cidade não muda conforme as outras. */
  function filtrar(dados, chaves) {
    var rotas = {};
    chaves.forEach(function (k) { if (k && dados.rotas[k]) rotas[k] = dados.rotas[k]; });
    var copia = {};
    Object.keys(dados).forEach(function (k) { copia[k] = dados[k]; });
    copia.rotas = rotas;
    return copia;
  }

  LE.selecao = { MAX: MAX, normalizar: normalizar, siglas: siglas, filtrar: filtrar };

  var doc = global.document;
  if (!doc || !doc.querySelector) return;

  var atual = null;   // as MAX posições

  function lerLocal() {
    try { return (global.localStorage.getItem(CHAVE_LOCAL) || '').split(','); } catch (e) { return []; }
  }
  function gravarLocal(texto) {
    try { global.localStorage.setItem(CHAVE_LOCAL, texto); } catch (e) { /* sem armazenamento: fica na URL */ }
  }

  function inicial(dados) {
    var params = new URLSearchParams(global.location.search);
    var daUrl = params.get('cidades');
    return normalizar(daUrl ? daUrl.split(',') : lerLocal(), Object.keys(dados.rotas), params.get('destino'));
  }

  /* "RIO,,BSB": as posições vazias do meio ficam, as do fim saem. */
  function texto(pos) {
    return pos.map(function (k) { return k || ''; }).join(',').replace(/,+$/, '');
  }

  /* Leva a escolha nos links entre as telas, para valer mesmo sem localStorage. */
  function atualizarLinks(t) {
    doc.querySelectorAll('a[href$=".html"], a[href*=".html?"]').forEach(function (a) {
      var href = a.getAttribute('href');
      if (/^[a-z]+:/i.test(href) || href.indexOf('docs/') === 0) return;
      a.setAttribute('href', href.split('?')[0] + '?cidades=' + t);
    });
  }

  function aplicar(pos) {
    atual = pos;
    var t = texto(pos);
    gravarLocal(t);
    var url = new URL(global.location.href);
    url.searchParams.set('cidades', t);
    url.searchParams.delete('destino');
    try { global.history.replaceState(null, '', url.pathname + url.search.replace(/%2C/gi, ',') + url.hash); } catch (e) { /* file:// */ }
    atualizarLinks(t);
  }

  function posicoes(dados) {
    if (!atual && dados) aplicar(inicial(dados));
    return atual || PADRAO.concat([null]);
  }

  function chaves(dados) { return siglas(posicoes(dados)); }

  /* Número da cor (1..MAX) da cidade escolhida; 0 se não está na comparação. */
  function serie(sigla) { return atual ? atual.indexOf(sigla) + 1 : 0; }

  function desenharSeletor(el, dados) {
    el.textContent = '';
    var grupo = doc.createElement('div');
    grupo.className = 'seletor-cidades';
    grupo.setAttribute('role', 'group');
    grupo.setAttribute('aria-label', 'Cidades em comparação, até ' + MAX);
    var titulo = doc.createElement('p');
    titulo.className = 'seletor-titulo';
    titulo.textContent = 'Comparar até ' + MAX + ' cidades';
    titulo.setAttribute('aria-hidden', 'true');
    grupo.appendChild(titulo);
    var lista = doc.createElement('div');
    lista.className = 'seletor-opcoes';
    var cheio = siglas(atual).length >= MAX;
    Object.keys(dados.rotas).forEach(function (k) {
      var rotulo = doc.createElement('label');
      rotulo.className = 'seletor-opcao';
      var caixa = doc.createElement('input');
      caixa.type = 'checkbox';
      caixa.value = k;
      caixa.checked = atual.indexOf(k) !== -1;
      caixa.disabled = !caixa.checked && cheio;
      var cor = doc.createElement('span');
      cor.className = 'seletor-cor';
      cor.setAttribute('aria-hidden', 'true');
      if (caixa.checked) cor.style.background = 'var(--serie-' + serie(k) + ')';
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
    var pos = atual.slice();
    if (caixa.checked) {
      var livre = pos.indexOf(null);
      if (livre === -1) { caixa.checked = false; return; }
      pos[livre] = caixa.value;
    } else {
      pos[pos.indexOf(caixa.value)] = null;
      if (!siglas(pos).length) { caixa.checked = true; return; }   // ao menos uma cidade
    }
    aplicar(pos);
    desenharSeletores(LE.dados);
    doc.dispatchEvent(new CustomEvent('le:selecao', { detail: chaves() }));
  });

  /* Registrado antes do js/graficos.js e do js/tabelas.js: a escolha já
     existe quando eles montam a tela. */
  doc.addEventListener('le:dados', function (e) {
    posicoes(e.detail);
    desenharSeletores(e.detail);
  });

  LE.selecao.chaves = chaves;
  LE.selecao.serie = serie;
  LE.selecao.daTela = function (dados) { return filtrar(dados, chaves(dados)); };
})(window);
