/* Linhas Estatísticas — pesos da Visão Geral
 * Requer js/normalizar.js (LE.stats). Não carrega dados: espera o evento
 * 'le:dados' do js/graficos.js, ou usa LE.dados se ele já chegou.
 * O radar não muda com os pesos: ele mostra os eixos sem peso, e o peso
 * só entra no score composto. Exposto em window.LE.pesos.
 */
(function (global) {
  'use strict';

  var LE = (global.LE = global.LE || {});
  var S = LE.stats;

  /* Os mesmos valores estão nos atributos dos <input type="range"> para a
     página fazer sentido antes do JS; ao ligar, o JS os reaplica daqui. */
  var PESO_INICIAL = 25;
  var PESO_MIN = 0;
  var PESO_MAX = 100;
  var PASSO = 5;
  var CASAS_SCORE = 2;
  var CASAS_PESO = 0;

  /* Abaixo disso a diferença some no arredondamento de duas casas e não
     sustenta dizer que uma cidade venceu. */
  var EMPATE = 0.01;

  var DIMENSOES = ['passagem', 'hospedagem', 'alimentacao', 'clima'];

  var MSG_SEM_PESO = 'Defina ao menos um peso maior que zero.';
  var MSG_EMPATE = 'As duas cidades ficam praticamente empatadas com estes pesos.';
  var MSG_SEM_DADOS = 'Ainda faltam dados para calcular o score com estes pesos.';
  var MSG_FORA = 'Fora do cálculo por falta de dados: ';

  function somaPesos(pesos) {
    return DIMENSOES.reduce(function (a, k) { return a + (Number(pesos[k]) || 0); }, 0);
  }

  /* "A", "A e B", "A, B e C". */
  function juntar(lista) {
    if (lista.length < 2) return lista.join('');
    return lista.slice(0, -1).join(', ') + ' e ' + lista[lista.length - 1];
  }

  function eixosNulos(pontos) {
    return S.EIXOS_RADAR.filter(function (_, i) { return pontos[i] === null || pontos[i] === undefined; });
  }

  /* Uma lista só quando as duas cidades perdem os mesmos eixos; senão, por cidade. */
  function fraseFora(cidades) {
    var comFalta = cidades.filter(function (c) { return c.fora.length; });
    if (!comFalta.length) return '';
    var iguais = cidades.every(function (c) { return c.fora.join('|') === cidades[0].fora.join('|'); });
    if (iguais) return MSG_FORA + juntar(cidades[0].fora) + '.';
    return MSG_FORA + comFalta.map(function (c) { return c.nome + ', ' + juntar(c.fora); }).join('; ') + '.';
  }

  /* Conclusão para os 4 pesos (passagem, hospedagem, alimentacao, clima), em
     duas partes: a frase do score e a dos eixos de fora (vazia se não houver).
     Função pura: a tela e os testes chamam a mesma. */
  function partes(dados, pesos) {
    if (somaPesos(pesos) === 0) return { principal: MSG_SEM_PESO, fora: '' };

    var pesos5 = S.expandirPesos(pesos);
    var cidades = Object.keys(dados.rotas).map(function (k) {
      var pontos = S.perfilRadar(dados, k);
      return {
        nome: dados.rotas[k].cidade,
        score: S.scoreComposto(pontos, pesos5),
        fora: eixosNulos(pontos)
      };
    });

    var comScore = cidades.filter(function (c) { return c.score !== null; });
    var semScore = cidades.filter(function (c) { return c.score === null; });
    var principal;

    if (!comScore.length) {
      principal = MSG_SEM_DADOS;
    } else if (semScore.length) {
      principal = 'Com estes pesos, ' + comScore.map(function (c) {
        return c.nome + ' soma ' + S.numero(c.score, CASAS_SCORE);
      }).join(' e ') + '; ' + juntar(semScore.map(function (c) { return c.nome; }))
        + ' ainda não tem dados para estes pesos.';
    } else {
      var ordem = cidades.slice().sort(function (a, b) { return b.score - a.score; });
      var a = ordem[0];
      var b = ordem[1];
      principal = Math.abs(a.score - b.score) < EMPATE
        ? MSG_EMPATE
        : 'Com estes pesos, ' + a.nome + ' soma ' + S.numero(a.score, CASAS_SCORE)
          + ' e ' + b.nome + ' soma ' + S.numero(b.score, CASAS_SCORE) + '.';
    }

    return { principal: principal, fora: fraseFora(cidades) };
  }

  function conclusao(dados, pesos) {
    var p = partes(dados, pesos);
    return p.fora ? p.principal + ' ' + p.fora : p.principal;
  }

  LE.pesos = {
    conclusao: conclusao,
    partes: partes,
    PESO_INICIAL: PESO_INICIAL,
    EMPATE: EMPATE
  };

  /* ---------- tela ---------- */

  var doc = global.document;
  if (!doc || !doc.querySelector) return;

  var dadosAtuais = null;

  function painel() { return doc.querySelector('[data-pesos]'); }
  function entrada(k) { return doc.getElementById('peso-' + k); }

  function lerPesos() {
    var p = {};
    DIMENSOES.forEach(function (k) {
      var el = entrada(k);
      p[k] = el ? Number(el.value) : 0;
    });
    return p;
  }

  function atualizar() {
    var pesos = lerPesos();
    var soma = somaPesos(pesos);

    DIMENSOES.forEach(function (k) {
      var saida = doc.getElementById('efetivo-' + k);
      if (saida) saida.textContent = soma === 0 ? '—' : S.porcentagem(pesos[k] / soma, CASAS_PESO);
    });
    var campoSoma = doc.getElementById('pesos-soma');
    if (campoSoma) campoSoma.textContent = soma.toLocaleString('pt-BR');

    var alvo = doc.getElementById('conclusao');
    if (!alvo || !dadosAtuais) return;
    var p = partes(dadosAtuais, pesos);
    var frase = doc.createElement('span');
    frase.textContent = p.principal;
    alvo.replaceChildren(frase);
    if (p.fora) {
      var nota = doc.createElement('span');
      nota.className = 'conclusao-nota';
      nota.textContent = ' ' + p.fora;
      alvo.appendChild(nota);
    }
  }

  function pesosIguais() {
    DIMENSOES.forEach(function (k) {
      var el = entrada(k);
      if (el) el.value = PESO_INICIAL;
    });
    atualizar();
  }

  var ligado = false;
  function ligar() {
    if (ligado) return;
    var p = painel();
    if (!p) return;
    ligado = true;
    DIMENSOES.forEach(function (k) {
      var el = entrada(k);
      if (!el) return;
      el.min = PESO_MIN;
      el.max = PESO_MAX;
      el.step = PASSO;
    });
    p.addEventListener('input', atualizar);
    var botao = doc.getElementById('pesos-iguais');
    if (botao) botao.addEventListener('click', pesosIguais);
    atualizar();
  }

  function comDados(dados) {
    dadosAtuais = dados;
    ligar();
    atualizar();
  }

  doc.addEventListener('le:dados', function (e) { comDados(e.detail); });

  function iniciar() {
    ligar();
    if (LE.dados) comDados(LE.dados);
  }

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})(window);
