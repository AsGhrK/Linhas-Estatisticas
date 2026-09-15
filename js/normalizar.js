/* Linhas Estatísticas — camada estatística
 * Sem dependência. Expõe tudo em window.LE.stats
 */
(function (global) {
  'use strict';

  var LE = (global.LE = global.LE || {});

  /* Remove null/undefined/NaN. Mês sem operação da companhia entra como null
     no JSON, e null NÃO é zero: zero seria lido como passagem de graça. */
  function limpar(valores) {
    return valores.filter(function (v) {
      return v !== null && v !== undefined && !Number.isNaN(v);
    });
  }

  function media(valores) {
    var v = limpar(valores);
    if (!v.length) return null;
    return v.reduce(function (a, b) { return a + b; }, 0) / v.length;
  }

  function mediana(valores) {
    var v = limpar(valores).slice().sort(function (a, b) { return a - b; });
    if (!v.length) return null;
    var meio = Math.floor(v.length / 2);
    return v.length % 2 ? v[meio] : (v[meio - 1] + v[meio]) / 2;
  }

  /* Amostral (n-1) por padrão: os preços coletados são uma amostra do ano,
     não a população inteira de tarifas praticadas. Use populacao=true só
     quando o conjunto for completo. */
  function desvioPadrao(valores, populacao) {
    var v = limpar(valores);
    if (v.length < 2) return null;
    var m = media(v);
    var soma = v.reduce(function (a, b) { return a + Math.pow(b - m, 2); }, 0);
    return Math.sqrt(soma / (populacao ? v.length : v.length - 1));
  }

  /* Adimensional: compara dispersão entre rotas de preço médio diferente,
     coisa que o desvio padrão bruto não faz. É o número que responde
     "qual companhia tem preço mais imprevisível". */
  function coefVariacao(valores) {
    var m = media(valores);
    var s = desvioPadrao(valores);
    if (!m || s === null) return null;
    return s / m;
  }

  function extremos(valores) {
    var v = limpar(valores);
    if (!v.length) return { minimo: null, maximo: null };
    return { minimo: Math.min.apply(null, v), maximo: Math.max.apply(null, v) };
  }

  function resumo(valores) {
    var v = limpar(valores);
    var e = extremos(v);
    return {
      n: v.length,
      media: media(v),
      mediana: mediana(v),
      desvio_padrao: desvioPadrao(v),
      coef_variacao: coefVariacao(v),
      minimo: e.minimo,
      maximo: e.maximo,
      amplitude: e.maximo !== null ? e.maximo - e.minimo : null
    };
  }

  /* ---------- normalização ---------- */

  function normalizar(valor, minimo, maximo) {
    if (valor === null || valor === undefined) return null;
    if (maximo === minimo) return 0.5;          // evita divisão por zero
    var z = (valor - minimo) / (maximo - minimo);
    return Math.min(1, Math.max(0, z));         // trava fora da faixa em 0..1
  }

  /* Eixos onde MENOS é MELHOR. Sem a inversão, o radar desenha a cidade
     mais cara como a melhor opção e o gráfico inteiro mente. */
  var MENOR_E_MELHOR = [
    'preco_passagem',
    'custo_hotel',
    'custo_alimentacao',
    'precipitacao'
  ];

  function pontuarEixo(eixo, valor, faixa) {
    var z = normalizar(valor, faixa.min, faixa.max);
    if (z === null) return null;
    return MENOR_E_MELHOR.indexOf(eixo) !== -1 ? 1 - z : z;
  }

  /* Conforto térmico: distância até 24 °C, tolerância de 12 °C para cada lado.
     Não é min-max porque nem temperatura alta nem baixa é "melhor" — o ótimo
     fica no meio. Declare esse 24 na metodologia do relatório. */
  var TEMP_IDEAL = 24;
  var TOLERANCIA = 12;

  function confortoTermico(tempMedia) {
    if (tempMedia === null || tempMedia === undefined) return null;
    var d = Math.abs(tempMedia - TEMP_IDEAL) / TOLERANCIA;
    return Math.min(1, Math.max(0, 1 - d));
  }

  /* ---------- radar ---------- */

  var EIXOS_RADAR = [
    'Passagem',
    'Hospedagem',
    'Alimentação',
    'Conforto térmico',
    'Tempo seco'
  ];

  function perfilRadar(dados, sigla) {
    var rota = dados.rotas[sigla];
    var f = dados.faixas;

    var precos = rota.passagens.companhias.reduce(function (acc, c) {
      return acc.concat(c.precos);
    }, []);

    var tempMedia = media(rota.clima.temp_max.map(function (mx, i) {
      return (mx + rota.clima.temp_min[i]) / 2;
    }));

    return [
      pontuarEixo('preco_passagem', media(precos), f.preco_passagem),
      pontuarEixo('custo_hotel', rota.hotel.diaria_mediana, f.custo_hotel),
      pontuarEixo('custo_alimentacao', rota.alimentacao.media_diaria, f.custo_alimentacao),
      confortoTermico(tempMedia),
      pontuarEixo('precipitacao', media(rota.clima.precipitacao), f.precipitacao)
    ];
  }

  /* Score composto. Pesos somam 1 — se não somarem, normaliza sozinho.
     Deixar os pesos visíveis na interface é o que torna o resultado honesto:
     "melhor viagem" é função da preferência declarada, não fato objetivo. */
  function scoreComposto(pontos, pesos) {
    var p = pesos || EIXOS_RADAR.map(function () { return 1 / EIXOS_RADAR.length; });
    var somaPesos = p.reduce(function (a, b) { return a + b; }, 0);
    var total = 0;
    for (var i = 0; i < pontos.length; i++) {
      if (pontos[i] === null) continue;
      total += pontos[i] * (p[i] / somaPesos);
    }
    return total;
  }

  /* ---------- formatação ---------- */

  var brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

  function moeda(v) { return v === null ? '—' : brl.format(v); }
  function numero(v, casas) {
    return v === null ? '—' : v.toLocaleString('pt-BR', {
      minimumFractionDigits: casas === undefined ? 1 : casas,
      maximumFractionDigits: casas === undefined ? 1 : casas
    });
  }

  LE.stats = {
    limpar: limpar,
    media: media,
    mediana: mediana,
    desvioPadrao: desvioPadrao,
    coefVariacao: coefVariacao,
    extremos: extremos,
    resumo: resumo,
    normalizar: normalizar,
    pontuarEixo: pontuarEixo,
    confortoTermico: confortoTermico,
    perfilRadar: perfilRadar,
    scoreComposto: scoreComposto,
    MENOR_E_MELHOR: MENOR_E_MELHOR,
    EIXOS_RADAR: EIXOS_RADAR,
    moeda: moeda,
    numero: numero
  };
})(window);