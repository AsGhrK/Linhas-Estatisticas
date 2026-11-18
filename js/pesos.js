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

  /* Abaixo disso a diferença some no arredondamento de duas casas e não
     sustenta dizer que uma cidade venceu. */
  var EMPATE = 0.01;

  var DIMENSOES = ['passagem', 'hospedagem', 'alimentacao', 'clima'];
  /* Dimensão de cada eixo do radar, na ordem de EIXOS_RADAR: o clima tem dois. */
  var DIMENSAO_DO_EIXO = ['passagem', 'hospedagem', 'alimentacao', 'clima', 'clima'];

  var MSG_SEM_PESO = 'Defina ao menos um peso maior que zero.';
  var MSG_EMPATE = 'As duas cidades ficam praticamente empatadas com estes pesos.';
  var MSG_SEM_DADOS = 'Ainda faltam dados para calcular o score com estes pesos.';
  var MSG_FORA = 'Fora do cálculo por falta de dados: ';
  var MSG_PEQUENA = 'Fora do cálculo por amostra pequena: ';
  var TEXTO_FORA = 'fora do cálculo';

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

  /* Falta de dados: uma lista só quando as duas cidades perdem os mesmos eixos;
     senão, por cidade. Amostra pequena vale para as duas cidades e sai à parte. */
  function fraseFora(cidades, pequena) {
    var falta = cidades.map(function (c) {
      return { nome: c.nome, fora: c.fora.filter(function (e) { return pequena.indexOf(e) === -1; }) };
    });
    var comFalta = falta.filter(function (c) { return c.fora.length; });
    var frases = [];
    if (comFalta.length) {
      var iguais = falta.every(function (c) { return c.fora.join('|') === falta[0].fora.join('|'); });
      frases.push(MSG_FORA + (iguais ? juntar(falta[0].fora)
        : comFalta.map(function (c) { return c.nome + ', ' + juntar(c.fora); }).join('; ')) + '.');
    }
    if (pequena.length) frases.push(MSG_PEQUENA + juntar(pequena) + '.');
    return frases.join(' ');
  }

  /* Inteiros proporcionais a `valores` que somam `total`, pelo maior resto:
     sem isso, três terços arredondados somam 99. Soma zero devolve null. */
  function maiorResto(valores, total) {
    var soma = valores.reduce(function (a, v) { return a + v; }, 0);
    if (soma === 0) return null;
    var exatos = valores.map(function (v) { return v * total / soma; });
    var inteiros = exatos.map(Math.floor);
    var falta = total - inteiros.reduce(function (a, v) { return a + v; }, 0);
    exatos.map(function (_, i) { return i; })
      .sort(function (a, b) { return (exatos[b] - inteiros[b]) - (exatos[a] - inteiros[a]); })
      .slice(0, falta)
      .forEach(function (i) { inteiros[i] += 1; });
    return inteiros;
  }

  /* Texto de cada controle: a parte do peso que entra no score, em porcentagem
     inteira, contando só os eixos com nota nas duas cidades. Com um eixo só, o
     clima entra com metade do peso, como no scoreComposto. Sem dados, conta tudo. */
  function efetivos(dados, pesos) {
    var perfis = dados ? Object.keys(dados.rotas).map(function (k) { return S.perfilRadar(dados, k); }) : [];
    var pesos5 = S.expandirPesos(pesos);
    var peso = {};
    DIMENSAO_DO_EIXO.forEach(function (dim, i) {
      var comNota = perfis.every(function (p) { return p[i] !== null && p[i] !== undefined; });
      if (comNota) peso[dim] = (peso[dim] || 0) + (Number(pesos5[i]) || 0);
    });
    var dentro = DIMENSOES.filter(function (k) { return k in peso; });
    var inteiros = maiorResto(dentro.map(function (k) { return peso[k]; }), 100);
    var textos = {};
    DIMENSOES.forEach(function (k) {
      var i = dentro.indexOf(k);
      textos[k] = i === -1 ? TEXTO_FORA : inteiros ? inteiros[i] + '%' : '—';
    });
    return textos;
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

    return { principal: principal, fora: fraseFora(cidades, S.eixosAmostraPequena(dados)) };
  }

  function conclusao(dados, pesos) {
    var p = partes(dados, pesos);
    return p.fora ? p.principal + ' ' + p.fora : p.principal;
  }

  LE.pesos = {
    conclusao: conclusao,
    partes: partes,
    efetivos: efetivos,
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
    var textos = efetivos(dadosAtuais, pesos);

    DIMENSOES.forEach(function (k) {
      var saida = doc.getElementById('efetivo-' + k);
      if (saida) saida.textContent = textos[k];
    });
    var campoSoma = doc.getElementById('pesos-soma');
    if (campoSoma) campoSoma.textContent = somaPesos(pesos).toLocaleString('pt-BR');

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
