/* Linhas Estatísticas — destaque da rota escolhida na landing.
 * Lê ?destino=RIO|SAO e marca a seção "#rota-<SIGLA>" com .rota-destacada.
 * Não acessa dados. Valor inválido ou ausente: não faz nada.
 */
(function () {
  'use strict';

  var destino = new URLSearchParams(window.location.search).get('destino');
  if (destino !== 'RIO' && destino !== 'SAO') return;

  var secao = document.getElementById('rota-' + destino);
  if (secao) secao.classList.add('rota-destacada');
})();
