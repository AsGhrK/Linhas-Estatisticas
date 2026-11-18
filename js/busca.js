/* Linhas Estatísticas — destaque da rota escolhida na landing.
 * Lê ?destino=<SIGLA> e marca a seção "#rota-<SIGLA>" com .rota-destacada.
 * O js/selecao.js já põe o destino entre as cidades em comparação; as seções
 * por cidade só existem depois que o js/tabelas.js as monta.
 */
(function () {
  'use strict';

  var destino = new URLSearchParams(window.location.search).get('destino');
  if (!/^[A-Z]{3}$/.test(destino || '')) return;

  document.addEventListener('le:dados', function () {
    setTimeout(function () {
      var secao = document.getElementById('rota-' + destino);
      if (secao) secao.classList.add('rota-destacada');
    }, 0);
  });
})();
