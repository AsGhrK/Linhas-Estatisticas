global.window = global;
require('../js/normalizar.js');
require('../js/pesos.js');
const { test } = require('node:test');
const assert = require('node:assert');
const falsos = require('../dados/dados-falsos.json');
// Coleta parcial: só a passagem tem faixa; hotel e clima faltam e a alimentação tem amostra pequena.
const parcial = structuredClone(falsos);
for (const eixo of ['custo_hotel', 'temperatura_media', 'precipitacao', 'custo_alimentacao']) {
  parcial.faixas[eixo] = null;
}
for (const rota of Object.values(parcial.rotas)) {
  for (const serie of ['temp_max', 'temp_min', 'precipitacao']) rota.clima[serie] = rota.clima[serie].map(() => null);
}

const P = window.LE.pesos;
const S = window.LE.stats;
const SO_PASSAGEM = { passagem: 100, hospedagem: 0, alimentacao: 0, clima: 0 };
const IGUAIS = { passagem: 25, hospedagem: 25, alimentacao: 25, clima: 25 };

test('só passagem: vence a cidade com a média ponderada de passagem menor', () => {
  const r = falsos.rotas;
  const barata = r.RIO.passagens.estatisticas.media < r.SAO.passagens.estatisticas.media ? r.RIO : r.SAO;
  const cara = barata === r.RIO ? r.SAO : r.RIO;
  const texto = P.conclusao(falsos, SO_PASSAGEM);
  assert.ok(texto.startsWith('Com estes pesos, ' + barata.cidade + ' soma '), texto);
  assert.ok(texto.includes(' e ' + cara.cidade + ' soma '), texto);
});

test('o score sai com duas casas e vírgula, a maior primeiro', () => {
  const pesos5 = S.expandirPesos(SO_PASSAGEM);
  const sao = S.scoreComposto(S.perfilRadar(falsos, 'SAO'), pesos5);
  const rio = S.scoreComposto(S.perfilRadar(falsos, 'RIO'), pesos5);
  assert.strictEqual(P.conclusao(falsos, SO_PASSAGEM),
    'Com estes pesos, São Paulo soma ' + S.numero(sao, 2) + ' e Rio de Janeiro soma ' + S.numero(rio, 2) + '.');
  assert.match(S.numero(sao, 2), /^\d,\d\d$/);
});

test('pesos todos em zero pedem um peso maior que zero', () => {
  assert.strictEqual(P.conclusao(falsos, { passagem: 0, hospedagem: 0, alimentacao: 0, clima: 0 }),
    'Defina ao menos um peso maior que zero.');
});

test('diferença menor que 0,01 é empate', () => {
  const d = structuredClone(falsos);
  d.rotas.RIO.passagens.estatisticas.media = d.rotas.SAO.passagens.estatisticas.media;
  assert.strictEqual(P.conclusao(d, SO_PASSAGEM), 'As duas cidades ficam praticamente empatadas com estes pesos.');
});

test('diferença de 0,01 ou mais não é empate', () => {
  const d = structuredClone(falsos);
  const f = d.faixas.preco_passagem;
  // Passagem normalizada: 1 − (media − min) / (max − min). Diferença de 0,02 entre as cidades.
  d.rotas.SAO.passagens.estatisticas.media = f.min + 0.50 * (f.max - f.min);
  d.rotas.RIO.passagens.estatisticas.media = f.min + 0.52 * (f.max - f.min);
  const texto = P.conclusao(d, SO_PASSAGEM);
  assert.ok(texto.startsWith('Com estes pesos, São Paulo soma 0,50 e Rio de Janeiro soma 0,48.'), texto);
});

test('eixo sem dado é listado pelo nome do radar', () => {
  const d = structuredClone(falsos);
  d.faixas.custo_hotel = null;
  const texto = P.conclusao(d, IGUAIS);
  assert.ok(texto.startsWith('Com estes pesos, '), texto);
  assert.ok(texto.endsWith(' Fora do cálculo por falta de dados: Hospedagem.'), texto);
});

test('com tudo coletado não há frase de eixo de fora', () => {
  assert.ok(!P.conclusao(falsos, IGUAIS).includes('Fora do cálculo'));
});

test('coleta parcial: eixos sem dado e alimentação com amostra pequena saem em frases separadas', () => {
  const texto = P.conclusao(parcial, IGUAIS);
  assert.ok(texto.startsWith('Com estes pesos, '), texto);
  assert.ok(texto.endsWith(' Fora do cálculo por falta de dados: Hospedagem, Conforto térmico e Tempo seco.'
    + ' Fora do cálculo por amostra pequena: Alimentação.'), texto);
});

test('alimentação com valor nas duas cidades e sem faixa é amostra pequena, não falta de dados', () => {
  const d = structuredClone(falsos);
  d.faixas.custo_alimentacao = null;
  assert.strictEqual(P.partes(d, IGUAIS).fora, 'Fora do cálculo por amostra pequena: Alimentação.');
});

test('alimentação sem valor numa cidade é falta de dados', () => {
  const d = structuredClone(falsos);
  d.faixas.custo_alimentacao = null;
  d.rotas.RIO.alimentacao.media_diaria = null;
  assert.ok(P.partes(d, IGUAIS).fora.startsWith('Fora do cálculo por falta de dados: '), P.partes(d, IGUAIS).fora);
  assert.ok(!P.partes(d, IGUAIS).fora.includes('amostra pequena'));
});

function somaExibida(textos) {
  return Object.values(textos).filter((t) => t.endsWith('%')).reduce((a, t) => a + Number(t.slice(0, -1)), 0);
}

test('pesos exibidos somam exatamente cem (maior resto)', () => {
  const t = P.efetivos(falsos, { passagem: 5, hospedagem: 5, alimentacao: 5, clima: 0 });
  assert.strictEqual(somaExibida(t), 100);
  assert.strictEqual(t.clima, '0%');
  assert.deepStrictEqual(Object.values(t).filter((x) => x !== '0%').sort(), ['33%', '33%', '34%']);
});

test('pesos exibidos somam cem também quando a divisão não é exata', () => {
  for (const p of [{ passagem: 35, hospedagem: 30, alimentacao: 20, clima: 5 },
    { passagem: 10, hospedagem: 10, alimentacao: 10, clima: 5 }]) {
    assert.strictEqual(somaExibida(P.efetivos(falsos, p)), 100, JSON.stringify(p));
  }
});

test('coleta parcial: só a passagem entra, o resto fica fora do cálculo', () => {
  assert.deepStrictEqual(P.efetivos(parcial, IGUAIS), {
    passagem: '100%', hospedagem: 'fora do cálculo', alimentacao: 'fora do cálculo', clima: 'fora do cálculo'
  });
});

test('soma zero mostra traço', () => {
  const t = P.efetivos(falsos, { passagem: 0, hospedagem: 0, alimentacao: 0, clima: 0 });
  assert.deepStrictEqual(Object.values(t), ['—', '—', '—', '—']);
  assert.strictEqual(P.efetivos(parcial, { passagem: 0, hospedagem: 50, alimentacao: 0, clima: 0 }).passagem, '—');
});

test('clima com um eixo só entra com metade do peso', () => {
  const d = structuredClone(falsos);
  d.rotas.RIO.clima.precipitacao[0] = null;   // tempo seco fora, conforto térmico dentro
  assert.deepStrictEqual(P.efetivos(d, { passagem: 50, hospedagem: 0, alimentacao: 0, clima: 100 }),
    { passagem: '50%', hospedagem: '0%', alimentacao: '0%', clima: '50%' });
});

test('peso só em eixos sem dado: faltam dados, não peso zero', () => {
  const texto = P.conclusao(parcial, { passagem: 0, hospedagem: 50, alimentacao: 0, clima: 0 });
  assert.ok(texto.startsWith('Ainda faltam dados para calcular o score com estes pesos.'), texto);
  assert.ok(texto.includes('Fora do cálculo por falta de dados: '), texto);
});

test('eixos de fora diferentes em cada cidade saem por cidade', () => {
  const d = structuredClone(falsos);
  d.rotas.RIO.hotel.diaria_mediana = null;
  d.rotas.SAO.clima.precipitacao[0] = null;
  const texto = P.conclusao(d, IGUAIS);
  assert.ok(texto.endsWith(' Fora do cálculo por falta de dados: Rio de Janeiro, Hospedagem; São Paulo, Tempo seco.'), texto);
});

test('só uma cidade com score', () => {
  const d = structuredClone(falsos);
  d.rotas.RIO.passagens.estatisticas.media = null;
  const texto = P.conclusao(d, SO_PASSAGEM);
  assert.ok(texto.startsWith('Com estes pesos, São Paulo soma '), texto);
  assert.ok(texto.includes('Rio de Janeiro ainda não tem dados para estes pesos.'), texto);
});

test('partes separa a frase do score da frase dos eixos de fora', () => {
  const p = P.partes(parcial, IGUAIS);
  assert.ok(p.principal.startsWith('Com estes pesos, '), p.principal);
  assert.ok(p.fora.startsWith('Fora do cálculo por falta de dados: '), p.fora);
  assert.strictEqual(P.conclusao(parcial, IGUAIS), p.principal + ' ' + p.fora);
  assert.strictEqual(P.partes(falsos, IGUAIS).fora, '');
});
