(function (global) {
  'use strict';

  function media(valores) {
    if (!valores || !valores.length) return 0;
    return valores.reduce((soma, v) => soma + v, 0) / valores.length;
  }

  function mediana(valores) {
    if (!valores || !valores.length) return 0;
    const ordenado = [...valores].sort((a, b) => a - b);
    const meio = Math.floor(ordenado.length / 2);
    return ordenado.length % 2 === 0
      ? (ordenado[meio - 1] + ordenado[meio]) / 2
      : ordenado[meio];
  }

  function variancia(valores, amostral = true) {
    if (!valores || valores.length < 2) return 0;
    const m = media(valores);
    const somaQuadrados = valores.reduce((soma, v) => soma + (v - m) ** 2, 0);
    const divisor = amostral ? valores.length - 1 : valores.length;
    return somaQuadrados / divisor;
  }

  function desvioPadrao(valores, amostral = true) {
    return Math.sqrt(variancia(valores, amostral));
  }

  function coeficienteVariacao(valores, amostral = true) {
    const m = media(valores);
    if (m === 0) return 0;
    return (desvioPadrao(valores, amostral) / m) * 100;
  }

  function normalizar(valores) {
    if (!valores || !valores.length) return [];
    const min = Math.min(...valores);
    const max = Math.max(...valores);
    const amplitude = max - min;
    if (amplitude === 0) return valores.map(() => 0.5);
    return valores.map((v) => (v - min) / amplitude);
  }

  function zScore(valores) {
    const m = media(valores);
    const dp = desvioPadrao(valores);
    if (dp === 0) return valores.map(() => 0);
    return valores.map((v) => (v - m) / dp);
  }

  global.Estatistica = {
    media,
    mediana,
    variancia,
    desvioPadrao,
    coeficienteVariacao,
    normalizar,
    zScore,
  };
})(window);
